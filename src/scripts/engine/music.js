/**
 * Created by Michael on 29/11/2014.
 */
import {BufferLoader, Sound} from './audioUtils.js';

export const music = (function () {

    var module = {},
        masterGain,
        context,
        musicLoop,
        gain = 1;


    module.load = function (initialVolume) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            context = new AudioContext();
            masterGain = context.createGain();
            masterGain.connect(context.destination);
        }

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

    module.play = function () {
        if (typeof musicLoop !== 'undefined') {
            musicLoop.play(null, true);
        }
    };

    module.setVolume = function (val) {
        if (0 <= val && val <= 1) {
            gain = val;
            musicLoop.setGain(gain);
        }
    };

    module.fadeOut = function () {
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
