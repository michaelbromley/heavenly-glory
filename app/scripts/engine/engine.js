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
        sfx.loadSounds();
        music.load(0.6);
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
        sfx.generate(motionData);
        requestAnimationFrame(update);
    }

    /*function drawVideo() {
        contextOut.drawImage(video, 0, 0, video.width, video.height);
    }*/

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
