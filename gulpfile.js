'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var concat = require('gulp-concat');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
// var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var babel = require("gulp-babel");

gulp.task('javascript', function () {
  return gulp.src(["./dep-chart.js", "./pos-map.js"])    
    // .pipe(source('app.js'))
    // .pipe(buffer())
    // .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel({presets: ["env"]}))
    .pipe(concat("app.js"))
    .pipe(uglify())
    .on('error', gutil.log)
    // .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('default', function(){
    
});

gulp.task('watch', function(){
    var watcher = gulp.watch('*.js', ['javascript']);
    watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});