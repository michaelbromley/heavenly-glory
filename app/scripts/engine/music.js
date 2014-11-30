/**
 * Created by Michael on 29/11/2014.
 */

var music = (function() {

    var module = {},
        masterGain,
        context,
        musicLoop;

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    masterGain = context.createGain();
    masterGain.connect(context.destination);

    module.load = function() {
            var bufferLoader = new BufferLoader(
                context,
                ['assets/audio/music-loop-01.mp3'],
                finishedLoading
            );

            bufferLoader.load();
        };

    function finishedLoading(bufferList) {
        musicLoop = new Sound(bufferList[0], context, masterGain);
    }

    module.play = function() {
        if (typeof musicLoop !== 'undefined') {
            musicLoop.play(null, true);
        }
    };

    return module;

})();