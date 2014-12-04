/**
 * Created by Michael on 21/11/2014.
 */

readTitles();

$('.start').on('click', function(e) {
    e.preventDefault();

    if (hgEngine.browserSupportCheck()) {
        $('.splash').hide();
        $('.loader').show();
        setTimeout(function () {
            $('.loader').removeClass('hidden');
        }, 100);
        setTitles();
        initSequencer();
        setTimeout(function () {
            startMovie(onMovieStarted);
        }, 3500);
    } else {
        $('.splash').hide();
        $('.no-support-warning').removeClass('hidden');
    }
});

$('.settings-icon').on('click', function() {
    $('.settings-panel').toggleClass('hidden');
});

$('.display-debug').on('change', function() {
    hgEngine.showDebugCanvas($(this).is(':checked'));
});

function onMovieStarted() {
    sequencer.start();
}

function readTitles() {
    var titles = decodeTitlesFromHash(),
        movieName = titles[0] || 'Enter The Webcam',
        actorName = titles[1] || 'Your Name';

    $('.movie-name').html(titles[0]);
    $('.actor-name').html(titles[1]);
}

function setTitles() {
    var movieName = $('.movie-name').html(),
        actorName = $('.actor-name').html();

    $('.movie-name-title').html(movieName);
    $('.actor-name-title').html(actorName);

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
        $('.loader').hide();
        $('body').addClass('theater');
        $('.output-container').show();
        $('.overlay').removeClass('hidden');
    });
    sequencer.registerEvent(1500, function() {
        $('.title-hg').removeClass('hidden');
    });
    sequencer.registerEvent(4000, function() {
        $('.title-hg').addClass('hidden');
    });
    sequencer.registerEvent(6000, function() {
        $('.title-movie').removeClass('hidden');
    });
    sequencer.registerEvent(9000, function() {
        $('.title-movie').addClass('hidden');
    });
    sequencer.registerEvent(11000, function() {
        $('.title-actor').removeClass('hidden');
    });
    sequencer.registerEvent(12000, function() {
        $('.overlay').addClass('transparent');
    });
    sequencer.registerEvent(30000, function() {
        $('.overlay').addClass('hidden');
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


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik MÃ¶ller. fixes from Paul Irish and Tino Zijdel

// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());