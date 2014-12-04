var gulp = require('gulp');
var del = require('del');
var server = require('gulp-express');

gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['client/dist'], cb);
});

gulp.task('libs', ['clean'], function() {
    gulp.src([
        './node_modules/jquery/dist/jquery.min.js',
        './bower_components/underscore/underscore.js',
        './bower_components/gl-matrix/dist/gl-matrix.js'
    ]).pipe(gulp.dest('./client/dist/lib'));
});

var scripts = function() {
    gulp.src('./client/src/scripts/**')
        .pipe(gulp.dest('./client/dist/scripts'));
};

var styles = function() {
    gulp.src('./client/src/styles/**')
        .pipe(gulp.dest('./client/dist/styles'));
};

var images = function() {
    gulp.src('./client/src/images/**')
        .pipe(gulp.dest('./client/dist/images'));
};

var html = function() {
    gulp.src('./client/src/*.html')
        .pipe(gulp.dest('./client/dist'));
};

gulp.task('scripts', ['clean'], scripts);
gulp.task('scripts-dirty', scripts);

gulp.task('styles', ['clean'], styles);
gulp.task('styles-dirty', styles);

gulp.task('images', ['clean'], images);
gulp.task('images-dirty', images);

gulp.task('html', ['clean'], html);
gulp.task('html-dirty', html);

gulp.task('build', ['scripts', 'styles', 'images', 'html', 'libs']);

gulp.task('serve', ['build'], function () {
    // Start the server at the beginning of the task
    server.run({
        file: 'server/app.js'
    });

    // Restart the server when file changes
    gulp.watch(['client/src/*.html'], ['html-dirty']);
    gulp.watch(['client/src/scripts/**/*.js'], ['scripts-dirty']);
    gulp.watch(['client/src/styles/**/*.css'], ['styles-dirty']);
    gulp.watch(['client/src/images/**'], ['images-dirty']);
    gulp.watch(['server/app.js'], server.run);
});

gulp.task('default', ['serve']);