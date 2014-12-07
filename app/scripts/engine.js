(function(window){

    "use strict";

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
var motionDetector = (function() {

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
/**
 * This module adds a red "blood" blend overlay to the output when the motion activity
 * goes above a certain threshold.
 */
var outputEffect = (function() {

    var module = {},
        contextOut,
        alpha = 0,
        activity = 0,
        w,
        h,
        ACTIVITY_THRESHOLD = 100;

    module.init = function(outputCanvas, width, height) {
        w = width;
        h = height;
        contextOut = outputCanvas.getContext('2d');
    };

    module.drawOverlay = function(motionData) {
        var intensity = 0;

        motionData.forEach(function(motionValue) {
            if (intensity < motionValue) {
                intensity = motionValue;
            }
        });

        if (90 < intensity) {
            activity += ACTIVITY_THRESHOLD;
        } else if (70 < intensity) {
            activity += intensity;
        }


        if (ACTIVITY_THRESHOLD < activity) {
            activity -= ACTIVITY_THRESHOLD;
            alpha = 1;
        }

        if (0 < alpha) {
            contextOut.fillStyle = 'hsla(0, 100%, 50%, ' + alpha + ')';
            contextOut.globalCompositeOperation = 'darken';
            contextOut.fillRect(0, 0, w, h);
            contextOut.globalCompositeOperation = 'source-over';
        }


        if (0.05 < alpha) {
            alpha -= 0.01;
        } else {
            alpha = 0;
        }
        if (5 < activity) {
            activity -= 10;
        } else {
            activity = 0;
        }
    };

    return module;

})();
/**
 * Created by Michael on 29/11/2014.
 */


/**
 * Object representing a sound sample, containing all audio nodes and a play method.
 *
 * @param buffer
 * @param context
 * @param defaultOutputNode
 * @constructor
 */
function Sound(buffer, context, defaultOutputNode) {
    var source,
        defaultOutputNode = defaultOutputNode || context.destination,
        gain = context.createGain(),
        playbackRate = 1;


    this.setPlaybackRate = function(value) {
        playbackRate = value;
    };

    this.setGain = function(value) {
        if (0 <= value && value <= 1) {
            gain.gain.value = value;
        }
    };

    this.play = function(outputNode, loop, onEnded) {
        outputNode = outputNode || defaultOutputNode;
        loop = loop || false;
        source = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        if (loop) {
            source.loop = true;
        }
        source.connect(gain);
        gain.connect(outputNode);

        if (onEnded) {
            source.onended = onEnded;
        }

        source.start();
    };

    this.stop = function() {
        source.stop();
    };
}

/**
 * Taken from http://www.html5rocks.com/en/tutorials/webaudio/intro/
 * @param context
 * @param urlList
 * @param callback
 * @constructor
 */
function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = [];
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length) {
                    loader.onload(loader.bufferList);
                }
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    };

    request.send();
};

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};
/**
 * Created by Michael on 29/11/2014.
 */

var music = (function() {

    var module = {},
        masterGain,
        context,
        musicLoop,
        gain = 1;

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) {
        context = new AudioContext();
        masterGain = context.createGain();
        masterGain.connect(context.destination);
    }

    module.load = function(initialVolume) {
        var bufferLoader = new BufferLoader(
            context,
            ['assets/audio/music-loop-01.ogg'],
            finishedLoading
        );
        gain = initialVolume;
        bufferLoader.load();
    };

    function finishedLoading(bufferList) {
        musicLoop = new Sound(bufferList[0], context, masterGain);
        musicLoop.setGain(gain);
    }

    module.play = function() {
        if (typeof musicLoop !== 'undefined') {
            musicLoop.play(null, true);
        }
    };

    module.setVolume = function(val) {
        if (0 <= val && val <= 1) {
            gain = val;
            musicLoop.setGain(gain);
        }
    };

    module.fadeOut = function() {
        fadeOut();
    };

    function fadeOut() {
        var decrement = 0.05;
        if (decrement <= gain) {
            gain -= decrement;
            module.setVolume(gain);
            setTimeout(fadeOut, 700);
        } else {
            musicLoop.stop();
        }
    }

    return module;

})();
var sfx = (function() {

    var module = {},
        sounds = {},
        masterGain,
        context,
        areaWidth = 640,
        areaHeight = 480;

    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) {
        context = new AudioContext();
        masterGain = context.createGain();
        masterGain.connect(context.destination);
    }

    module.loadSounds = function() {
        var bufferLoader = new BufferLoader(
            context,
            [
                'assets/audio/swoosh-soft-01.ogg',
                'assets/audio/swoosh-soft-02.ogg',
                'assets/audio/swoosh-soft-03.ogg',
                'assets/audio/swoosh-hard-01.ogg',
                'assets/audio/swoosh-hard-02.ogg',
                'assets/audio/swoosh-hard-03.ogg',
                'assets/audio/swoosh-hard-04.ogg',
                'assets/audio/swoosh-hard-05.ogg',
                'assets/audio/swoosh-hard-06.ogg',
                'assets/audio/punch-hard-01.ogg',
                'assets/audio/punch-hard-02.ogg',
                'assets/audio/punch-hard-03.ogg',
                'assets/audio/punch-hard-04.ogg',
                'assets/audio/punch-hard-05.ogg',
                'assets/audio/punch-hard-06.ogg',
                'assets/audio/punch-hard-07.ogg'
            ],
            finishedLoading
        );

        bufferLoader.load();
    };

    function finishedLoading(bufferList) {
        // create the various soundsets from the loaded samples
        sounds.swooshSoft = addSoundsFromBufferList(bufferList, 0, 2);
        sounds.swooshHard = addSoundsFromBufferList(bufferList, 3, 8);
        sounds.punchHard = addSoundsFromBufferList(bufferList, 9, 15);
    }

    function addSoundsFromBufferList(bufferList, start, end) {
        var i,
            newSound,
            soundSet = new SoundSet();

        for (i = start; i <= end; i++ ) {
            newSound = new Sound(bufferList[i], context, masterGain);
            soundSet.addSound(newSound);
        }

        return soundSet;
    }

    /**
     * Sets the dimensions of the space in which the sfx occur, which affects how much sounds
     * are panned.
     *
     * @param width
     * @param height
     */
    module.setAreaDimensions = function(width, height) {
        areaWidth = width;
        areaHeight = height;
    };

    module.setGain = function(value) {
        masterGain.gain.value = value;
    };


    module.generate = function(motionData) {
        var playSwooshHard = {},
            playSwooshSoft = {},
            playPunch = {};

        motionData.forEach(function(motionValue, i) {
            if (60 < motionValue) {
                playPunch.triggered = true;
                playPunch.volume = motionValue / 100;
                playPunch.pan = regionIndexToPanCoordinates(i);
            }
            if (50 < motionValue) {
                playSwooshHard.triggered = true;
                playSwooshHard.volume = motionValue / 100;
                playSwooshHard.pan = regionIndexToPanCoordinates(i);
            }
            if (30 < motionValue) {
                playSwooshSoft.triggered = true;
                playSwooshSoft.volume = motionValue / 100;
                playSwooshSoft.pan = regionIndexToPanCoordinates(i);
            }
        });

        if (playPunch.triggered) {
            sounds.punchHard.trigger(playPunch.volume, playPunch.pan.x, playPunch.pan.y);
        } else if (playSwooshHard.triggered) {
            sounds.swooshHard.trigger(playSwooshHard.volume, playSwooshHard.pan.x, playSwooshHard.pan.y);
        } else if (playSwooshSoft.triggered) {
            sounds.swooshSoft.trigger(playSwooshSoft.volume, playSwooshSoft.pan.x, playSwooshSoft.pan.y);
        }
    };

    /**
     * Convert the region index i to a set of {x, y} coordinates relative to the centre of the
     * sound area.
     *
     * @param i
     * @returns {{x: number, y: number}}
     */
    function regionIndexToPanCoordinates(i) {
        var x, y;

        if (i <= 2) {
            y = -1;
        } else if (i <= 5) {
            y = 0;
        } else {
            y = 1;
        }

        if (i % 3 === 0) {
            x = -1;
        } else if ((i - 1) % 3 === 0) {
            x = 0;
        } else {
            x = 1;
        }

        return {
            x: x,
            y: y
        };
    }

    return module;
})();

/**
 * Object representing a collection of Sounds which are grouped as one "set", i.e. variations on the same
 * sound, which can be randomly selected to give a sense of variation.
 *
 */
function SoundSet() {
    var sounds = [],
        isPlaying = false;

    this.addSound = function(item) {
        sounds.push(item);
    };

    this.trigger = function(volume, x, y) {
        var randomSound;

        if (!isPlaying) {
            randomSound = sounds[Math.floor(Math.random() * sounds.length)];
            randomSound.setGain(volume);
           // randomSound.setPosition(0, 0, 0);
            randomSound.play(null, null, soundEnded);
            isPlaying = true;
        }
    };

    function soundEnded() {
        isPlaying = false;
    }
}
/**
 * The hgEngine (heavenly-glory-engine) object ties together the video capture via `getUserMedia()`, the motion
 * detection, and the triggering of sound effects via the Web Audio API in response to detected motion.
 *
 */
var hgEngine = (function() {

    var module = {},
        isStreaming = false,
        video,
        canvasOut,
        contextOut,
        w,
        h,
        showDebugCanvas = false;

    /**
     * Check to see if the browser supports the two key technologies required for the engine to run:
     * Web Audio and GetUserMedia.
     */
    module.browserSupportCheck = function() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            return false;
        }
        if (!(navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia)) {
            return false;
        }
        return true;
    };

    module.init = function(outputElement, width, height, onPlayCallback) {
        w = width;
        h = height;
        canvasOut = outputElement;
        contextOut = canvasOut.getContext('2d');
        motionDetector.init();
        outputEffect.init(canvasOut, w, h);
        sfx.loadSounds();
        sfx.setGain(3);
        music.load(0.5);
        createVideoElement();
        startCapturing(onPlayCallback);
    };

    module.fadeOutMusic = function() {
        music.fadeOut();
    };

    module.showDebugCanvas = function(val) {
        if (typeof val !== 'undefined') {
            showDebugCanvas = !!val;
        } else {
            return showDebugCanvas;
        }
    };

    module.setSensitivity = function(val) {
        var inverseVal = 100 - val;
        motionDetector.setSensitivity(inverseVal);
    };

    function createVideoElement() {
        var videoElement = document.createElement('video');
        videoElement.setAttribute('id', 'video');
        videoElement.setAttribute('width', w);
        videoElement.setAttribute('height', h);
        videoElement.style.display = 'none';
        document.body.appendChild(videoElement);
        video = videoElement;

        video.addEventListener('canplay', function() {
            if (!isStreaming) {
                // videoWidth isn't always set correctly in all browsers
                if (video.videoWidth > 0) {
                    h = video.videoHeight / (video.videoWidth / w);
                }
                canvasOut.setAttribute('width', w);
                canvasOut.setAttribute('height', h);
                // Reverse the canvas image
                contextOut.translate(w, 0);
                contextOut.scale(-1, 1);
                isStreaming = true;
            }
        }, false);

        video.addEventListener('play', function() {
            update();
        }, false);
    }

    function startCapturing(onPlayCallback) {

        navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
        if (navigator.getUserMedia) {
            // Request access to video only
            navigator.getUserMedia({
                    video:true,
                    audio:false
                },
                function(stream) {
                    var url = window.URL || window.webkitURL;
                    video.src = url ? url.createObjectURL(stream) : stream;
                    video.play();
                    music.play();
                    if (onPlayCallback) {
                        onPlayCallback();
                    }
                },
                function(error) {
                    alert('Something went wrong. (error code ' + error.code + ')');
                    return;
                }
            );
        } else {
            alert('Sorry, the browser you are using doesn\'t support getUserMedia');
            return;
        }

    }

    /**
     * The main animation loop. Draws the video to the canvas, detects motion and triggers sound effects.
     */
    function update() {
        var motionData;

        drawVideo();
        motionData = motionDetector.analyze(contextOut, showDebugCanvas);
        outputEffect.drawOverlay(motionData);
        sfx.generate(motionData);
        requestAnimationFrame(update);
    }

    function drawVideo() {

        try {
            contextOut.drawImage(video, 0, 0, video.width, video.height);
        } catch (e) {
            if (e.name == "NS_ERROR_NOT_AVAILABLE") {
                // Wait a bit before trying again; you may wish to change the
                // length of this delay.
                console.log('video exception caught' + Date.now().toString());
                setTimeout(drawVideo, 10);
            } else {
                throw e;
            }
        }
    }


    return module;

})();

window.hgEngine = hgEngine;


})(window);