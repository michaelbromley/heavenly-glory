/**
 * The Motion Detector module takes a canvas context as an input to the
 * `analyze()` method, and examines any motion that has occurred since the last
 * call to `analyze()`.
 *
 * The constructor takes an options object which can be used to specify the width and height of the
 * target canvas, and the number of regions to split the canvas into for purposes of detecting motion in
 * each discrete region.
 *
 * The essence of this object was taken directly from https://github.com/ReallyGood/js-motion-detection,
 * which in turn is an implementation of the code used in the "Magic Xylophone" demo by @soundstep. Read his
 * article about the technique here: http://www.adobe.com/devnet/archive/html5/articles/javascript-motion-detection.html
 *
 * @param userOptions
 * @returns {{analyze: analyze}}
 * @constructor
 */
export const motionDetector = (function() {

    var module = {},
        canvasBlend,
        contextBlend,
        contextScale,
        lastImageData,
        regions = [],
        maxPixelCount = [],
        w,
        h,
        options,
        defaultOptions = {
            width: 320,
            height: 240,
            horizontalRegions: 3,
            verticalRegions: 3,
            displayDebugCanvas: true,
            sensitivity: 50
        };

    /**
     * Initialize the motion detector module and specify options.
     * @param userOptions
     */
    module.init = function(userOptions) {
        options = mergeOptions(userOptions, defaultOptions);
        w = options.width;
        h = options.height;
        createBlendCanvas();
        createScaleCanvas();
        createRegions(options.horizontalRegions, options.verticalRegions);
    };

    module.setSensitivity = function(val) {
        if (0 <= val && val <= 100) {
            if (typeof options === 'undefined') {
                defaultOptions.sensitivity = val;
            } else {
                options.sensitivity = val;
            }
        }
    };

    /**
     * Given a canvas context, compare the current frame against the frame from the last call to this function, and
     * return an array of the percentage of changed pixels in each region of the canvas.
     *
     * The second argument, if true, outputs the data to the blend canvas for debug purposes.
     *
     * @param contextOut
     * @param showDebugData
     * @returns {Array}
     */
    module.analyze = function(contextOut, showDebugData) {
        var motionByRegion,
            motionData,
            scaledContext;

        scaledContext = scaleContextOut(contextOut);
        motionData = doBlend(scaledContext);
        motionByRegion = detectMotionByRegion(motionData.data);

        if (showDebugData) {
            contextBlend.canvas.style.display = 'block';
            contextBlend.putImageData(motionData, 0, 0);
            drawRegions(motionByRegion);
        } else {
            contextBlend.canvas.style.display = 'none';
        }

        return motionByRegion;
    };

    /**
     * Merge any user options with the defaultOptions and return the resulting object.
     *
     * @param userOptions
     * @param defaultOptions
     * @returns {{}}
     */
    function mergeOptions(userOptions, defaultOptions) {
        var mergedOptions = {};
        userOptions = userOptions || {};

        for (var option in defaultOptions) {
            if (defaultOptions.hasOwnProperty(option)) {
                mergedOptions[option] = typeof userOptions[option] !== 'undefined' ? userOptions[option] : defaultOptions[option];
            }
        }

        return mergedOptions;
    }

    /**
     * Creates the canvas which will be used to draw out the diff between one frame and the next. This canvas will not be attached to the
     * DOM unless the motionDetector object was initialised with the displayDebugCanvas option set to true.
     */
    function createBlendCanvas() {
        canvasBlend = document.createElement('canvas');
        canvasBlend.setAttribute('id', 'canvas-blend');
        canvasBlend.setAttribute('width', w);
        canvasBlend.setAttribute('height', h);
        contextBlend = canvasBlend.getContext('2d');

        if (options.displayDebugCanvas) {
            document.body.appendChild(canvasBlend);
        }
    }

    /**
     * This context is used to scale the video feed canvas (contextOut) down to the same size as the
     * blend canvas, so we can sample the entire image but at a much smaller resolution, allowing for faster
     * calculation of the motion regions.
     */
    function createScaleCanvas() {
        var c = document.createElement('canvas');
        c.setAttribute('width', w);
        c.setAttribute('height', h);
        contextScale = c.getContext('2d');
    }


    /**
     * The blend canvas is divided up into n * m regions. Each region is an array in the form:
     * [ originX, originY, width, height ]
     * The regions are stored in the `regions` array.
     */
    function createRegions(n, m) {
        var width = Math.floor(w / n),
            height = Math.floor(h / m),
            originX,
            originY;

        for (originY = 0; originY <= h - height; originY += height) {
            for (originX = 0; originX <= w - width; originX += width) {
                regions.push([ originX, originY, width, height]);
            }
        }
    }

    /**
     * For debug purposes, overlay the blend canvas with the grid and highlight the regions in which motion is occurring.
     *
     * @param motionByRegion
     */
    function drawRegions(motionByRegion) {
        var alpha,
            pixelCount,
            r,
            region;

        contextBlend.strokeStyle = 'red';

        for (r = regions.length - 1; 0 <= r; r-- ) {
            region = regions[r];
            if (!maxPixelCount[r] || maxPixelCount[r] < motionByRegion[r]) {
                maxPixelCount[r] = motionByRegion[r];
            }
            pixelCount = maxPixelCount[r];
            alpha = pixelCount / 100;

            contextBlend.beginPath();
            contextBlend.rect(region[0], region[1], region[2], region[3]);
            contextBlend.fillStyle = 'rgba(255, 100, 100, ' + alpha + ')';
            contextBlend.fill();
            contextBlend.stroke();

            if (5 < maxPixelCount[r]) {
                maxPixelCount[r] -= 2;
            }
        }
    }

    /**
     * Examine the blend data to identify how many white pixels are in each region. Returns an array of values,
     * each value signifying the percentage of white pixels in the region at the same index.
     *
     * @param data
     * @returns {Array}
     */
    function detectMotionByRegion(data) {
        var i,
            r,
            region,
            totalWhitePixels = 0,
            whitePixelsByRegion = [],
            pixelsPerRegion,
            motionByRegion = [];

        for (r = regions.length - 1; 0 <= r; r-- ) {
            whitePixelsByRegion[r] = 0;
        }

        i = 0;
        while (i < (data.length * 0.25)) {
            if (data[i * 4] === 255) {
                region = getRegion(i);
                whitePixelsByRegion[region] ++;
                totalWhitePixels ++;
            }
            ++i;
        }

        // now convert the pixel count to a percentage of the total pixels in the region
        pixelsPerRegion = regions[0][2] * regions[0][3];
        for (r = regions.length - 1; 0 <= r; r-- ) {
            motionByRegion[r] = whitePixelsByRegion[r] / pixelsPerRegion * 100;
        }

        return motionByRegion;
    }

    function getRegion(pos) {
        var i = pos,
            regionWidth = regions[0][2],
            regionHeight = regions[0][3],
            regionsPerRow = Math.floor(w/regionWidth),
            columnPos = (i % w === 0 ? w : i % w) - 1,
            columnIndex = Math.floor(columnPos / regionWidth),
            rowIndex = Math.floor(Math.floor(i / w) / regionHeight);

        return columnIndex + rowIndex * regionsPerRow;
    }

    /**
     * Take the current canvas frame and compare it to the last, returning the result of the blend as an ImageData
     * object.
     *
     * @param contextOut
     * @returns {ImageData}
     */
    function doBlend(contextOut) {
        var blendedData,
            sourceData = contextOut.getImageData(0, 0, w, h);

        // create an image if the previous image doesn’t exist
        if (!lastImageData) {
            lastImageData = contextOut.getImageData(0, 0, w, h);
        }
        // create a ImageData instance to receive the blended result
        blendedData = contextOut.createImageData(w, h);
        // blend the 2 images
        differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
        lastImageData = sourceData;

        return blendedData;
        //return sourceData;
    }

    function differenceAccuracy(target, data1, data2) {
        var i;
        if (data1.length != data2.length) {
            return null;
        }
        i = 0;
        while (i < (data1.length * 0.25)) {
            var average1 = (data1[4 * i] + data1[4 * i + 1] + data1[4 * i + 2]) / 3;
            var average2 = (data2[4 * i] + data2[4 * i + 1] + data2[4 * i + 2]) / 3;
            var diff = threshold(fastAbs(average1 - average2));
            target[4 * i] = diff;
            target[4 * i + 1] = diff;
            target[4 * i + 2] = diff;
            target[4 * i + 3] = 255;
            ++i;
        }
    }

    /**
     * A fast version of Math.abs()
     * @param value
     * @returns {number}
     */
    function fastAbs(value) {
        return (value ^ (value >> 31)) - (value >> 31);
    }

    /**
     * Convert the pixel value to either black (0) or white (255) depending on whether the value
     * is above or below the threshold, as specified in options.sensitivity.
     * @param value
     * @returns {number}
     */
    function threshold(value) {
        return (value > options.sensitivity) ? 255 : 0;
    }

    function scaleContextOut(contextOut) {
        contextScale.drawImage(contextOut.canvas, 0, 0, w, h);
        return contextScale;
    }

    return module;

})();
