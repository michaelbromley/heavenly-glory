/**
 * Created by Michael on 21/11/2014.
 */


$('.start').on('click', function(e) {
    e.preventDefault();

    $('.splash').hide();
    $('.loader').show();
    setTimeout(function() {
        $('.loader').removeClass('hidden');
    }, 100);
    setTitles();
    initSequencer();
    setTimeout(function() {
        startMovie(onMovieStarted);
    }, 3500);
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

function setTitles() {
    var actorName = $('.actor-name').html();
    var movieName = $('.movie-name').html();
    $('.movie-name-title').html(movieName);
    $('.actor-name-title').html(actorName);
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