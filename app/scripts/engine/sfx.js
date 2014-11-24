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