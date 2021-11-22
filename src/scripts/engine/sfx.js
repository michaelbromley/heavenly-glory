import {BufferLoader, Sound} from './audioUtils.js';

export const sfx = (function () {

    var module = {},
        sounds = {},
        masterGain,
        context,
        areaWidth = 640,
        areaHeight = 480;

    module.loadSounds = function () {
        // Fix up prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            context = new AudioContext();
            masterGain = context.createGain();
            masterGain.connect(context.destination);
        }

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

        for (i = start; i <= end; i++) {
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
    module.setAreaDimensions = function (width, height) {
        areaWidth = width;
        areaHeight = height;
    };

    module.setGain = function (value) {
        masterGain.gain.value = value;
    };


    module.generate = function (motionData) {
        var playSwooshHard = {},
            playSwooshSoft = {},
            playPunch = {};

        motionData.forEach(function (motionValue, i) {
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
            sounds.punchHard?.trigger(playPunch.volume, playPunch.pan.x, playPunch.pan.y);
        } else if (playSwooshHard.triggered) {
            sounds.swooshHard?.trigger(playSwooshHard.volume, playSwooshHard.pan.x, playSwooshHard.pan.y);
        } else if (playSwooshSoft.triggered) {
            sounds.swooshSoft?.trigger(playSwooshSoft.volume, playSwooshSoft.pan.x, playSwooshSoft.pan.y);
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

    this.addSound = function (item) {
        sounds.push(item);
    };

    this.trigger = function (volume, x, y) {
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
