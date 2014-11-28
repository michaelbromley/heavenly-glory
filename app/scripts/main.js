/**
 * Created by Michael on 21/11/2014.
 */


$('.start').on('click', function() {

    $('.splash').addClass('hidden');
    $('.loader').removeClass('hidden');
    setTitles();
    startMovie(function() {
        $('.loader').addClass('hidden');
        $('.overlay').removeClass('hidden');
    });
});

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