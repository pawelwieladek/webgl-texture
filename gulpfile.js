var gulp = require('gulp');
var del = require('del');
var server = require('gulp-express');
var browserify = require('browserify');
var source = require("vinyl-source-stream");

gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['app/dist'], cb);
});

var scripts = function() {
    return browserify('./app/src/scripts/app.js')
        .transform("debowerify")
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('app/dist/scripts/'))
};

var styles = function() {
    gulp.src('./app/src/styles/**')
        .pipe(gulp.dest('./app/dist/styles'));
};

var images = function() {
    gulp.src('./app/src/images/**')
        .pipe(gulp.dest('./app/dist/images'));
};

var html = function() {
    gulp.src('./app/src/*.html')
        .pipe(gulp.dest('./app/dist'));
};

gulp.task('scripts', ['clean'], scripts);
gulp.task('scripts-dirty', scripts);

gulp.task('styles', ['clean'], styles);
gulp.task('styles-dirty', styles);

gulp.task('images', ['clean'], images);
gulp.task('images-dirty', images);

gulp.task('html', ['clean'], html);
gulp.task('html-dirty', html);

gulp.task('build', ['scripts', 'styles', 'images', 'html']);

gulp.task('serve', ['build'], function () {
    // Start the server at the beginning of the task
    server.run({
        file: 'server/app.js'
    });

    // Restart the server when file changes
    gulp.watch(['app/src/*.html'], ['html-dirty']);
    gulp.watch(['app/src/**/*.js'], ['scripts-dirty']);
    gulp.watch(['app/src/styles/**/*.css'], ['styles-dirty']);
    gulp.watch(['app/src/images/**'], ['images-dirty']);
    gulp.watch(['server/app.js'], server.run);
});

gulp.task('default', ['serve']);