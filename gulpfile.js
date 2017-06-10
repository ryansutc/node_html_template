/**
 * Created by RSutcliffe on 5/25/17.
 * gulp Gulp.js configuration for basic web page testing
 * and node
 * 
 * Steps for new machine/proj:
 * install gulp globally: npm install gulp-cli -g
 * install browserify globally: npm install browserify -g
 * install sass compiler globally: npm install node-sass -g 
 * install http-server globally (optional): npm install http-server -g
 * 
 * This gulp project setup is based on/ inspired by other gulp solutions below:
 * https://wehavefaces.net/gulp-browserify-the-gulp-y-way-bb359b3f9623
 * https://slicejack.com/introduction-to-postcss/
 * https://code.tutsplus.com/tutorials/gulp-as-a-development-web-server--cms-20903
 */

//module variables
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

    runseq = require('run-sequence'), //https://www.npmjs.com/package/run-sequence
    gulpif = require('gulp-if'),
    replace = require('gulp-replace'), //https://www.npmjs.com/package/gulp-replace
    rev = require('gulp-rev'), //https://www.npmjs.com/package/gulp-rev
    watch = require('gulp-watch'), //https://www.npmjs.com/package/gulp-watch
    browserify = require('browserify'), //https://www.npmjs.com/package/gulp-cache-bust
    connect = require('gulp-connect'), //https://www.npmjs.com/package/gulp-connect
    source = require('vinyl-source-stream'), //https://www.viget.com/articles/gulp-browserify-starter-faq
    transform = require('vinyl-transform'),
    buffer = require('vinyl-buffer'), // https://www.npmjs.com/package/vinyl-buffer
    mustache= require('gulp-mustache'), // https://www.npmjs.com/package/gulp-mustache
    isProd = false,
      
    // folders
    folder = { src: 'src/', build: 'build/'};
var mainjsfile = "main.js"
var mymanifestfile = 'build/rev-manifest.json';

if(process.argv[process.argv.length-1] == '--prod' || process.argv[process.argv.length-1] == '--production'){
  console.log("running in prod mode")
  isProd = true
}
else {
  console.log("running in dev mode")
}
//########################################

gulp.task('build', function(cb) {
  //build is set to run js & css tasks first, then html.
  runseq('js','css', 'html', cb)

})
gulp.task('default', ['build', 'watch']) ; //plain ol' terminal gulp will build & watch for changes

gulp.task('web', ['build', 'webserver', 'watch']) //gulp web will build & watch AND set up webserver

// HTML processing
gulp.task('html', function() {
  var out = folder.build + "html"
  console.log("output folder is: " + out)
  return gulp.src(folder.src + 'html/**/*')
      .pipe(newer(out))
      .pipe(mustache(parseManifest(mymanifestfile),{},{}))
      .pipe(gulpif(isProd, htmlclean())) // minify code if production
      .pipe(gulp.dest(out))
      .pipe(connect.reload());
});


gulp.task("js", function () {
  //delete existing built js file
  if(fs.existsSync(mymanifestfile)){
    var oldfile = findValueInManifest(mainjsfile, mymanifestfile)
    if(oldfile != null){
      try {guk
        fs.unlinkSync('build/js/' + oldfile);
        console.log('successfully deleted build/js/' + oldfile);
      } catch(err) {
        console.log('could not delete file (does it exist?)' + oldfile)
      }
    }
  }

  var files = glob.sync(folder.src + 'js/**/*.js');
  return gulpif(isProd,browserify(files), browserify(files, {debug:true}))
        .bundle()
        .pipe(source(mainjsfile))
        .pipe(buffer())
        .pipe(gulpif(isProd, stripdebug()))
        .pipe(gulpif(isProd,uglify()))
        .pipe(rev()) //cache busting
        .pipe(gulp.dest('./build/js/'))
        .pipe(rev.manifest('build/rev-manifest.json', {base: './build', merge: true}))
        .pipe(gulp.dest('./build'))
        .pipe(connect.reload())
        .on("end", function(){
          if(oldfile != undefined){
            var newfile = findValueInManifest(parseKeyFromValue(oldfile), mymanifestfile) //this isn't getting new file
            console.log("the new file is: " + newfile)
            gulp.src(folder.build + 'html/**/*.html')
              .pipe(replace(oldfile, newfile))
              .pipe(gulp.dest('build/html'));
          }
  });
});

gulp.task('css', function () {
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
  //delete previously built css file
  if(fs.existsSync(mymanifestfile)){ 
    var oldfile = findValueInManifest('main.css', mymanifestfile)
    if(oldfile != null){
      try {
        fs.unlinkSync('build/css/' + oldfile);
        console.log('successfully deleted build/css/' + oldfile);
      } catch(err) {
        console.log('could not delete file (does it exist?) ' + oldfile);
      }
    }
  }
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
        .pipe(rev.manifest('build/rev-manifest.json',{base: './build', merge: true}))
  return cssbuild.pipe(gulp.dest('./build'))
    
    .on('end', function(){
      if(oldfile != undefined){
        var newfile = findValueInManifest(parseKeyFromValue(oldfile), mymanifestfile)
        console.log("the new css file is: " + newfile)
        gulp.src(folder.build + 'html/**/*.html')
          .pipe(replace(oldfile, newfile))
          .pipe(gulp.dest('build/html'))
          .pipe(connect.reload());
      }
    })
});

// watch for changes (need to configure longer delay)
gulp.task('watch', function() {
  //html changes
  gulp.watch(folder.src + 'html/**/*', ['html']);
  // javascript changes
  gulp.watch(folder.src + 'js/**/*', ['js']);
  // css changes
  gulp.watch(folder.src + 'css/**/*', ['css']);
  return
});

//start a basic http webserver for testing
gulp.task('webserver', function() {
  connect.server({
    livereload: true
  });
});
//###########################################


function parseManifest(jsonfile){
  /**
 * Support function for gulp. Should probably
 * be its own module.
 * 
 * Description: Parses, manifest file to a 
 * mustache friendly json object
 */
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


function findValueInManifest(key, jsonfile){
  var manifest = JSON.parse(fs.readFileSync(jsonfile, 'utf8'));
    if (manifest.hasOwnProperty(key)) {
      return manifest[key]
    }
    else { return null}
}

function parseKeyFromValue(value){
 /**
  * Take a |value| like main-1ceb2A4hl93f.js
  * and return |key| like main.js
  */
 
  var res = value.split("-");
  var name = "";
  for (i = 0; i < res.length -1; i++){
    name += res[i] + "-";
  }
  var suffix = value.split('.').pop();
  name = name.slice(0, -1) + "." + suffix;	
  return name;
}
