/**
 * Created by inet2005 on 5/25/17.
 * gulp Gulp.js configuration
 * //install gulp globally: npm install gulp-cli -g
 * //install browserify globally: npm install -g browserify
 * //sass modules:
 * npm install gulp-sass gulp-postcss postcss-assets autoprefixer css-mqpacker cssnano --save-dev
 * 
 * https://wehavefaces.net/gulp-browserify-the-gulp-y-way-bb359b3f9623
 */

var gulp = require('gulp'),
    glob = require('glob'),
    newer = require('gulp-newer'),
    concat = require('gulp-concat'),
    deporder = require('gulp-deporder'), //https://github.com/mkleehammer/gulp-deporder
    stripdebug = require('gulp-strip-debug'), //https://www.npmjs.com/package/gulp-strip-debug
    uglify = require('gulp-uglify'),
    htmlclean = require('gulp-htmlclean'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'), //https://www.viget.com/articles/gulp-browserify-starter-faq says you need this to work with browserify in gulp to make it a stream
    transform = require('vinyl-transform'),
    yargs = require('yargs'),
    // development mode?
    devBuild = (process.env.NODE_ENV !== 'production'),

    // folders
    folder = { src: 'src/', build: 'build/'};


gulp.task('default', ['html', 'js']) ; //what to do if you just type gulp in terminal

// HTML processing
gulp.task('html', function() {
  var out = folder.build + "/html"
  var page = gulp.src(folder.src + 'html/**/*')
      .pipe(newer(out));

  // minify code if production
  if (!devBuild) {
    page = page.pipe(htmlclean());
  }

  return page.pipe(gulp.dest(out));
});



// JavaScript processing (https://www.sitepoint.com/introduction-gulp-js/)
gulp.task('js', function() {

  var jsbuild = gulp.src(folder.src + 'js/**/*')
    .pipe(deporder());
    //.pipe(concat('concat.js'));

  
  jsbuild = transform(function() {
    var b = browserify('concat.js');
    return b.bundle();
  });  
  
  if (!devBuild) {
    jsbuild = jsbuild
      .pipe(stripdebug())
      .pipe(uglify());
  }

  return jsbuild.pipe(gulp.dest(folder.build + 'js/**/*.js'));

});

gulp.task('browserify', ['js'], function() {
    return browserify() //'./build/js/concat.js'
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('./build/js/main.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./build/js/'));
});

gulp.task("bundle", function () {
  var files = glob.sync(folder.src + 'js/**/*.js');
  var jsbuild = browserify(files)
        .bundle()
        .pipe(source("main.js"))
        //.pipe(gulp.dest('./build/js/'))

  if (!devBuild) {
    jsbuild = jsbuild
      .pipe(stripdebug())
      .pipe(uglify())
  }

  return jsbuild.pipe(gulp.dest('./build/js/'))
});
