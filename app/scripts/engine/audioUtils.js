/**
 * Created by Michael on 29/11/2014.
 */


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