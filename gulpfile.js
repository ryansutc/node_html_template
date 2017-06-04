/**
 * Created by RSutcliffe on 5/25/17.
 * gulp Gulp.js configuration
 * 
 * Steps for new machine/proj:
 * install gulp globally: npm install gulp-cli -g
 * install browserify globally: npm install -g browserify
 * install sass compiler globally: npm install -g node-sass
 * //sass modules:
 * npm install gulp-sass gulp-postcss postcss-assets autoprefixer css-mqpacker cssnano --save-dev
 * 
 * https://wehavefaces.net/gulp-browserify-the-gulp-y-way-bb359b3f9623
 * https://slicejack.com/introduction-to-postcss/
 */

//No comment
var gulp = require('gulp'),
    fs = require('fs'),
    glob = require('glob'),
    newer = require('gulp-newer'),
    concat = require('gulp-concat'),
    deporder = require('gulp-deporder'), //https://github.com/mkleehammer/gulp-deporder
    stripdebug = require('gulp-strip-debug'), //https://www.npmjs.com/package/gulp-strip-debug
    uglify = require('gulp-uglify'),
    strreamify = require('gulp-streamify'), //https://github.com/nfroidure/gulp-streamify
    htmlclean = require('gulp-htmlclean'),
    sass = require('gulp-sass'), //https://github.com/dlmanning/gulp-sass
    postcss = require('gulp-postcss'),
    //PostCSS Plugins (http://postcss.org/)
    cssimport = require('postcss-import'), //merge css w import statements
    cssnano = require('cssnano'),  //minify css files
    autoprefixer = require('autoprefixer'), //auto-prefix with vendor specifics

    gulpif = require('gulp-if'),
    rev = require('gulp-rev'), //https://www.npmjs.com/package/gulp-rev
    watch = require('gulp-watch'), //https://www.npmjs.com/package/gulp-watchgulp
    browserify = require('browserify'), //https://www.npmjs.com/package/gulp-cache-bust
    source = require('vinyl-source-stream'), //https://www.viget.com/articles/gulp-browserify-starter-faq
    transform = require('vinyl-transform'),
    buffer = require('vinyl-buffer'), // https://www.npmjs.com/package/vinyl-buffer
    mustache= require('gulp-mustache'), // https://www.npmjs.com/package/gulp-mustache
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

gulp.task('run', ['html', 'js', 'css']); //terminal: gulp run will run all stuff
gulp.task('default', ['run', 'watch']) ; //plain ol' terminal gulp will do above & watch for changes

// HTML processing
gulp.task('html', ['js'], function() {
  var out = folder.build + "/html"
  var page = gulp.src(folder.src + 'html/**/*')
      .pipe(newer(out))
      //.pipe(mustache('./build/rev-manifest.json',{},{}))
      .pipe(mustache(parseManifest('./build/rev-manifest.json'),{},{}))
      
  // minify code if production
  if (isProd) {
    page = page.pipe(htmlclean());
  }

  return page.pipe(gulp.dest(out));
});

gulp.task("js", function () {
  var files = glob.sync(folder.src + 'js/**/*.js');
  var jsbuild = gulpif(isProd,browserify(files), browserify(files, {debug:true}))
        .bundle()
        .pipe(source("main.js"))
        .pipe(buffer())
        .pipe(gulpif(isProd, stripdebug()))
        .pipe(gulpif(isProd,uglify()))
        .pipe(rev()) //cache busting
        .pipe(gulp.dest('./build/js/'))
        .pipe(rev.manifest())
        
  return jsbuild.pipe(gulp.dest('./build'));
});

gulp.task('css', ['js'], function () {
  /**
   * SASS/CSS files are organized as per here:
   * http://thesassway.com/beginner/how-to-structure-a-sass-project
   * Modules, Partials, Vendored Stylesheets
   * 
   * the idea is that there is already 1 central css file that 
   * imports everything so we do not need to loop through the css
   * folder directory
   * 
   */
  var plugins = [
    cssimport, 
    autoprefixer,
	  cssnano];

  //var files = glob.sync(folder.src + 'css/*.sass');
  var cssbuild = gulp.src(folder.src + 'css/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(rev()) //cache busting
        .pipe(gulp.dest('./build/css/'))
        .pipe(rev.manifest({merge: true}))
  return cssbuild.pipe(gulp.dest('./build/css/'))
});

// watch for changes
gulp.task('watch', ['html'], function() {
  //html changes
  gulp.watch(folder.src + 'html/**/*', ['html']);
  // javascript changes
  gulp.watch(folder.src + 'js/**/*', ['js']);
  // css changes
  gulp.watch(folder.src + 'scss/**/*', ['css']);
  return
});


//###########################################
/**
 * Support function for gulp. Should probably
 * be its own module.
 * 
 * Description: Parses, manifest file to a 
 * mustache friendly json object
 */

function parseManifest(jsonfile){

    var manifest = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
    var newobj = {}
    for (var key in manifest){
        if (manifest.hasOwnProperty(key)) {
            // do stuff
            console.log(manifest[key])
            mainname = key.substring(0,key.indexOf('.'))
            suffixname = key.substring(key.indexOf('.')+1, key.length)
            if(!newobj.hasOwnProperty(mainname)){
                newobj[mainname] = {} 
            }
            var subprop = newobj[mainname]
            subprop[suffixname] = manifest[key]
        }
    }

    return newobj
}