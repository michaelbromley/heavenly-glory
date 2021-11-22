/**
 * Created by Michael on 21/11/2014.
 */
import { hgEngine } from './engine/engine.js';
import { motionDetector } from './engine/motionDetector.js';
import { music } from './engine/music.js';
import { outputEffect } from './engine/outputEffect.js';
import { sfx } from './engine/sfx.js';
import { sequencer } from './sequencer.js';

readTitles();

document.querySelector('.start').addEventListener('click', function(e) {
    e.preventDefault();

    if (hgEngine.browserSupportCheck()) {
        document.querySelector('.splash').classList.add('hidden');
        document.querySelector('.loader').classList.remove('hidden');
        setTimeout(function () {
            document.querySelector('.loader').classList.remove('hidden');
        }, 100);
        setTitles();
        initSequencer();
        sfx.loadSounds();
        music.load(0.5);
        setTimeout(function () {
            startMovie(onMovieStarted);
        }, 3500);
    } else {
        document.querySelector('.splash').classList.remove('hidden');
        document.querySelector('.no-support-warning').classList.remove('hidden');
    }
});

document.querySelector('.settings-icon').addEventListener('click', function() {
    document.querySelector('.settings-panel').classList.toggle('hidden');
});

document.querySelector('.display-debug').addEventListener('change', function() {
    hgEngine.showDebugCanvas(document.querySelector('.display-debug').checked);
});

document.querySelector('.sensitivity-slider').addEventListener('change', function() {
    var val = document.querySelector('.sensitivity-slider').value;
    document.querySelector('.sensitivity-label').innerHTML = (val);
    hgEngine.setSensitivity(val);
});

function onMovieStarted() {
    sequencer.start();
}

function readTitles() {
    var titles = decodeTitlesFromHash(),
        movieName = titles[0] || 'Enter The Webcam',
        actorName = titles[1] || 'This Person';

    document.querySelector('.movie-name').innerHTML = (movieName);
    document.querySelector('.actor-name').innerHTML = (actorName);
}

function setTitles() {
    var movieName = document.querySelector('.movie-name').innerHTML,
        actorName = document.querySelector('.actor-name').innerHTML;

    document.querySelector('.movie-name-title').innerHTML = movieName;
    document.querySelector('.actor-name-title').innerHTML = actorName;

    encodeTitlesToHash(movieName, actorName);
}

/**
 * Base-64 encodes the movie name and actor name and pushes it to the URL hash, so that they can be shared via URL.
 * @param m
 * @param a
 */
function encodeTitlesToHash(m, a) {
    var mEncoded = utf8_to_b64(m),
        aEncoded = utf8_to_b64(a);
    window.location.hash = mEncoded + '|' + aEncoded;
}

function decodeTitlesFromHash() {
    var hashParts,
        mDecoded,
        aDecoded;

    hashParts = window.location.hash.split('|');
    if (hashParts.length === 2) {
        try {
            mDecoded = b64_to_utf8(hashParts[0].substr(1));
            aDecoded = b64_to_utf8(hashParts[1])
        } catch (ex) {
            console.log('Could not decode url: ' + ex.message);
        }
    }

    return [mDecoded, aDecoded];
}

function startMovie(onPlayCallback) {
    var outputCanvas = document.querySelector('#output');
    var maxHeight = window.innerHeight;
    var width = Math.min(window.innerWidth, maxHeight * 4 / 3);
    var height = width * 0.75;
    hgEngine.init(outputCanvas, width, height, onPlayCallback);
}

function initSequencer() {
    sequencer.registerEvent(0, function() {
        document.querySelector('.loader').classList.add('hidden');
        document.querySelector('body').classList.add('theater');
        document.querySelector('.output-container').classList.remove('hidden');
        document.querySelector('.overlay').classList.remove('hidden');
        document.querySelector('.settings-panel').classList.remove('hidden');
        document.querySelector('.credits').classList.add('hidden');
    });
    sequencer.registerEvent(1500, function() {
        document.querySelector('.title-hg').classList.remove('hidden');
    });
    sequencer.registerEvent(4000, function() {
        document.querySelector('.title-hg').classList.add('hidden');
    });
    sequencer.registerEvent(6000, function() {
        document.querySelector('.title-movie').classList.remove('hidden');
    });
    sequencer.registerEvent(9000, function() {
        document.querySelector('.title-movie').classList.add('hidden');
    });
    sequencer.registerEvent(11000, function() {
        document.querySelector('.title-actor').classList.remove('hidden');
    });
    sequencer.registerEvent(12000, function() {
        document.querySelector('.overlay').classList.add('transparent');
    });
    sequencer.registerEvent(30000, function() {
        document.querySelector('.overlay').classList.add('hidden');
        hgEngine.fadeOutMusic();
    });
}

/**
 * UTF-8-safe base64 encoding/decoding as given on MDN
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64.btoa#Unicode_Strings
 * @param str
 * @returns {string}
 */
function utf8_to_b64(str) {
    return window.btoa(encodeURIComponent(escape(str)));
}

function b64_to_utf8(str) {
    return unescape(decodeURIComponent(window.atob(str)));
}
