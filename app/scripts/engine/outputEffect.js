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