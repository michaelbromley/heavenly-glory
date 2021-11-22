'use strict';
// generated on 2014-11-22 using generator-gulp-webapp 0.1.0

var gulp = require('gulp');

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
    return gulp.src('src/styles/main.scss')
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10
        }))
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size());
});

gulp.task('engine', function() {
    return gulp.src([
        'src/scripts/engine/motionDetector.js',
        'src/scripts/engine/outputEffect.js',
        'src/scripts/engine/audioUtils.js',
        'src/scripts/engine/music.js',
        'src/scripts/engine/sfx.js',
        'src/scripts/engine/engine.js'
    ])
        .pipe($.concat('engine.js'))
        .pipe($.wrap( { src: 'src/scripts/engine/wrapper.txt' }))
        .pipe(gulp.dest('src/scripts'));
});

gulp.task('scripts', ['engine'], function () {
    return gulp.src('src/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});

gulp.task('html', ['styles', 'scripts'], function () {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src('src/*.html')
        .pipe($.useref.assets({searchPath: '{.tmp,src}'}))
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('images', function () {
    return gulp.src('src/images/**/*')
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', function () {
    return $.bowerFiles()
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('extras', function () {
    return gulp.src(['src/*.*', 'src/assets*/**/*.*', '!src/*.html'], { dot: true })
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('src'))
        .use(connect.static('.tmp'))
        .use(connect.directory('src'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('serve', ['connect', 'styles'], function () {
    require('opn')('http://localhost:9000', 'chrome');
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('src/styles/*.scss')
        .pipe(wiredep({
            directory: 'src/bower_components'
        }))
        .pipe(gulp.dest('src/styles'));

    gulp.src('src/*.html')
        .pipe(wiredep({
            directory: 'src/bower_components'
        }))
        .pipe(gulp.dest('src'));
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes

    gulp.watch([
        'src/*.html',
        '.tmp/styles/**/*.css',
        'src/scripts/**/*.js',
        'src/images/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch('src/styles/**/*.scss', ['styles']);
    gulp.watch('src/scripts/**/*.js', ['scripts']);
    gulp.watch('src/images/**/*', ['images']);
    gulp.watch('bower.json', ['wiredep']);
});
