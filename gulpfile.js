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
    strreamify = require('gulp-streamify'), //https://github.com/nfroidure/gulp-streamify
    htmlclean = require('gulp-htmlclean'),
    gulpif = require('gulp-if'),
    rev = require('gulp-rev'), //https://www.npmjs.com/package/gulp-rev
    watch = require('gulp-watch'), //https://www.npmjs.com/package/gulp-watchgulp
    browserify = require('browserify'), //https://www.npmjs.com/package/gulp-cache-bust
    source = require('vinyl-source-stream'), //https://www.viget.com/articles/gulp-browserify-starter-faq says you need this to work with browserify in gulp to make it a stream
    transform = require('vinyl-transform'),
    buffer = require('vinyl-buffer'), // https://www.npmjs.com/package/vinyl-buffer
    isProd = false,
      
    // folders
    folder = { src: 'src/', build: 'build/'};

if(process.argv[process.argv.length-1] == '--prod' || process.argv[process.argv.length-1] == '--production'){
  console.log("running in prod mode")
  isProd = true
}
else {
  console.log("running in dev mode")
}

gulp.task('run', ['html', 'js']); //terminal: gulp run will run all stuff
gulp.task('default', ['run', 'watch']) ; //plain ol' terminal gulp will do above & watch for changes

// HTML processing
gulp.task('html', function() {
  var out = folder.build + "/html"
  var page = gulp.src(folder.src + 'html/**/*')
      .pipe(newer(out));
      
  // minify code if production
  if (isProd) {
    page = page.pipe(htmlclean());
  }

  return page.pipe(gulp.dest(out));
});


gulp.task("js", function () {
  var files = glob.sync(folder.src + 'js/**/*.js');
  var jsbuild = gulpif(isProd,browserify(files), browserify(files, {debug:true})) // {debug:true}
        .bundle()
        .pipe(source("main.js"))
        .pipe(buffer())
        .pipe(gulpif(isProd, stripdebug()))
        .pipe(gulpif(isProd,uglify()))
        

  return jsbuild.pipe(gulp.dest('./build/js/'))
});

// watch for changes
gulp.task('watch', function() {
  //html changes
  gulp.watch(folder.src + 'html/**/*', ['html']);
  // javascript changes
  gulp.watch(folder.src + 'js/**/*', ['js']);
  // css changes
  //gulp.watch(folder.src + 'scss/**/*', ['css']);

});
