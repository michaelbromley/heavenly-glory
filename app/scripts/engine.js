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
        lastImageData,
        regions = [],
        w,
        h,
        options,
        defaultOptions = {
            width: 640,
            height: 480,
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
        createRegions(options.horizontalRegions, options.verticalRegions);
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
            pixelCount = motionByRegion[r];
            alpha = pixelCount / 100;

            contextBlend.beginPath();
            contextBlend.rect(region[0], region[1], region[2], region[3]);
            contextBlend.fillStyle = 'rgba(255, 100, 100, ' + alpha + ')';
            contextBlend.fill();
            contextBlend.stroke();
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
            motionData;

        motionData = doBlend(contextOut);
        motionByRegion = detectMotionByRegion(motionData.data);

        if (showDebugData) {
            contextBlend.putImageData(motionData, 0, 0);
            drawRegions(motionByRegion);
        }

        return motionByRegion;
    };

    return module;

})();
var sfx = (function() {

    var module = {},
        sounds = {},
        masterGain,
        context;

    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    masterGain = context.createGain();
    masterGain.connect(context.destination);

    module.loadSounds = function(callback) {
        var bufferLoader = new BufferLoader(
            context,
            [
                'assets/audio/swoosh-01.mp3',
                'assets/audio/punch-01.mp3'
            ],
            finishedLoading
        );

        bufferLoader.load();
    };

    function finishedLoading(bufferList) {
        var swoosh, punch;

        // create the various soundsets from the loaded samples
        swoosh = new SoundSet();
        swoosh.addSound(new Sound(bufferList[0], context, masterGain));
        sounds.swoosh = swoosh;

        punch = new SoundSet();
        punch.addSound(new Sound(bufferList[1], context, masterGain));
        sounds.punch = punch;

        if (callback) {
            callback();
        }
    }

    module.setGain = function(value) {
        masterGain.gain.value = value;
    };


    module.generate = function(motionData) {
        var playSwoosh = false,
            playPunch = false;

        motionData.forEach(function(motion) {
            if (70 < motion) {
                playPunch = true;
            }
            if (30 < motion) {
                playSwoosh = true;
            }
        }); 

        if (playPunch) {
            sounds.punch.trigger();
        } else if (playSwoosh) {
            sounds.swoosh.trigger();
        }
    };

    return module;
})();

/**
 * Object representing a collection of Sounds which are grouped as one "set", i.e. variations on the same
 * sound, which can be randomly selected to give a sense of variation.
 *
 */
function SoundSet() {
    var sounds = [];

    this.addSound = function(item) {
        sounds.push(item);
    };

    this.trigger = function(volume, x, y) {
        var randomSound = sounds[Math.floor(Math.random()*sounds.length)];
        randomSound.play();
    }
}


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
        panner = context.createPanner(),
        gain = context.createGain(),
        playbackRate = 1;

    this.setPannerParameters = function(options) {
        for(var option in options) {
            if (options.hasOwnProperty(option)) {
                panner[option] = options[option];
            }
        }
    };

    this.setPlaybackRate = function(value) {
        playbackRate = value;
    };

    this.setGain = function(value) {
        gain.gain.value = value;
    };

    this.setPosition = function(x, y, z) {
        panner.setPosition(x, y, z);
    };

    this.setVelocity = function(vx, vy, vz) {
        panner.setVelocity(vx, vy, vz);
    };

    this.play = function(outputNode, loop) {
        outputNode = outputNode || defaultOutputNode;
        loop = loop || false;
        source = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        if (loop) {
            source.loop = true;
        }
        source.connect(gain);
        gain.connect(panner);
        panner.connect(outputNode);
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
        h;

    module.init = function(outputElement, width, height) {
        w = width;
        h = height;
        canvasOut = outputElement;
        contextOut = canvasOut.getContext('2d');
        motionDetector.init({
            width: w,
            height: h
        });
        sfx.loadSounds();
        createVideoElement();
        startCapturing();
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

    function startCapturing() {

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
                },
                function(error) {
                    alert('Something went wrong. (error code ' + error.code + ')');
                    return;
                }
            );
        }
        else {
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
        motionData = motionDetector.analyze(contextOut, true);
        sfx.generate(motionData);
        requestAnimationFrame(update);
    }

    function drawVideo() {
        contextOut.drawImage(video, 0, 0, video.width, video.height);
    }

    return module;

})();

window.hgEngine = hgEngine;


})(window);