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
        './bower_components/gl-matrix/dist/gl-matrix.js'
    ]).pipe(gulp.dest('./client/dist/lib'));
});

var scripts = function() {
    gulp.src('./client/src/**')
        .pipe(gulp.dest('./client/dist'));
};

gulp.task('scripts', ['clean'], scripts);
gulp.task('scripts-dirty', scripts);

gulp.task('build', ['scripts', 'libs']);

gulp.task('serve', ['build'], function () {
    // Start the server at the beginning of the task
    server.run({
        file: 'server/app.js'
    });

    // Restart the server when file changes
    gulp.watch(['client/src/**/*.html'], ['scripts-dirty']);
    gulp.watch(['server/app.js'], server.run);
});

gulp.task('default', ['serve']);