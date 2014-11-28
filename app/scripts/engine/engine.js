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

    module.init = function(outputElement, width, height, onPlayCallback) {
        w = width;
        h = height;
        canvasOut = outputElement;
        contextOut = canvasOut.getContext('2d');
        motionDetector.init();
        sfx.loadSounds();
        createVideoElement();
        startCapturing(onPlayCallback);
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
                    if (onPlayCallback) {
                        onPlayCallback();
                    }
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
