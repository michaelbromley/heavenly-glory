var sfx = (function() {

    var module = {},
        sounds = {},
        masterGain,
        context,
        areaWidth = 640,
        areaHeight = 480;

    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    masterGain = context.createGain();
    masterGain.connect(context.destination);

    module.loadSounds = function() {
        var bufferLoader = new BufferLoader(
            context,
            [
                'assets/audio/swoosh-soft-01.mp3',
                'assets/audio/swoosh-soft-02.mp3',
                'assets/audio/swoosh-soft-03.mp3',
                'assets/audio/swoosh-hard-01.mp3',
                'assets/audio/swoosh-hard-02.mp3',
                'assets/audio/swoosh-hard-03.mp3',
                'assets/audio/swoosh-hard-04.mp3',
                'assets/audio/swoosh-hard-05.mp3',
                'assets/audio/swoosh-hard-06.mp3',
                'assets/audio/punch-hard-01.mp3',
                'assets/audio/punch-hard-02.mp3',
                'assets/audio/punch-hard-03.mp3',
                'assets/audio/punch-hard-04.mp3',
                'assets/audio/punch-hard-05.mp3',
                'assets/audio/punch-hard-06.mp3',
                'assets/audio/punch-hard-07.mp3'
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
            newSound.setPannerParameters({
                coneOuterGain: 0.1,
                coneOuterAngle: 1,
                coneInnerAngle: 0,
                rolloffFactor: 0.9
            });
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
                playSwooshHard.volume = motionValue / 100;
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
            randomSound.setPosition(0, 0, 0);
            randomSound.play(null, null, soundEnded);
            isPlaying = true;
        }
    };

    function soundEnded() {
        isPlaying = false;
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
        gain.connect(panner);
        panner.connect(outputNode);

        if (onEnded) {
            //source.addEventListener('ended', onEnded)
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