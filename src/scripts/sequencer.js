/**
 * Created by Michael on 29/11/2014.
 */

export const sequencer = (function() {

    var module = {},
        events = [],
        startTime;

    /**
     * Register a callback function to be invoked after `time` milliseconds once the
     * `start()` method has been called.
     *
     * @param time
     * @param fn
     */
    module.registerEvent = function(time, fn) {
        events.push({ time: time, fn: fn });
    };

    module.start = function() {
        requestAnimationFrame(run);
    };

    function run(timestamp) {

        var elapsed,
            nextEvent;
        if (typeof startTime === 'undefined') {
            startTime = timestamp;
        }

        nextEvent = events[0];
        elapsed = timestamp - startTime;

        if (nextEvent.hasOwnProperty('time') && nextEvent.time < elapsed) {
            nextEvent.fn.call(null);
            events.shift();
        }

        if (0 < events.length) {
            requestAnimationFrame(run);
        }

    }

    return module;

})();
