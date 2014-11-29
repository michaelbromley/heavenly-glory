/**
 * Created by Michael on 21/11/2014.
 */


$('.start').on('click', function() {

    $('.splash').addClass('hidden');
    $('.loader').removeClass('hidden');
    setTitles();
    initSequencer();
    startMovie(onMovieStarted);
});

function onMovieStarted() {
    sequencer.start();
}

function setTitles() {
    var actorName = $('input[name="actor-name"]').val();
    var movieName = $('input[name="movie-name"]').val();
    $('.title-movie').html(movieName);
    $('.title-actor').html('Starring ' + actorName);
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
        $('.loader').addClass('hidden');
        $('.overlay').removeClass('hidden');
        console.log('event 1');
    });
    sequencer.registerEvent(3000, function() {
        $('.title-hg').removeClass('hidden');
        console.log('event 2');
    });
    sequencer.registerEvent(6000, function() {
        $('.title-hg').addClass('hidden');
        $('.title-movie').removeClass('hidden');
        console.log('event 3');
    });
    sequencer.registerEvent(9000, function() {
        $('.title-movie').addClass('hidden');
        $('.title-actor').removeClass('hidden');
        console.log('event 4');
    });
    sequencer.registerEvent(12000, function() {
        $('.title-actor').addClass('hidden');
        $('.overlay').addClass('transparent');
        console.log('event 5');
    });
    sequencer.registerEvent(20000, function() {
        $('.overlay').addClass('hidden');
        console.log('event 5');
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