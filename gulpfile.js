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
    replace = require('gulp-replace'), //https://www.npmjs.com/package/gulp-replace
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
var mainjsfile = "main.js"
var mymanifestfile = 'build/rev-manifest.json';

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
gulp.task('html', function() {
  var out = folder.build + "html"
  console.log("output folder is: " + out)
  var page = gulp.src(folder.src + 'html/**/*')
      .pipe(newer(out))
      .pipe(mustache(parseManifest(mymanifestfile),{},{}))
      
  // minify code if production
  if (isProd) {
    page = page.pipe(htmlclean());
  }

  return page.pipe(gulp.dest(out));
});


gulp.task("js", function () {
  //delete existing built js file
  if(fs.existsSync(mymanifestfile)){
    var oldfile = findValueInManifest(mainjsfile, mymanifestfile)
    if(oldfile != null){
      fs.unlinkSync('build/js/' + oldfile);
      console.log('successfully deleted build/js/' + oldfile);
    }
  }
  var files = glob.sync(folder.src + 'js/**/*.js');
  var jsbuild = gulpif(isProd,browserify(files), browserify(files, {debug:true}))
        .bundle()
        .pipe(source(mainjsfile))
        .pipe(buffer())
        .pipe(gulpif(isProd, stripdebug()))
        .pipe(gulpif(isProd,uglify()))
        .pipe(rev()) //cache busting
        .pipe(gulp.dest('./build/js/'))
        .pipe(rev.manifest('build/rev-manifest.json', {base: './build', merge: true}))
        .pipe(gulp.dest('./build'));
   if(oldfile != undefined){
     var newfile = findValueInManifest(parseKeyFromValue(oldfile), mymanifestfile) //this isn't getting new file
     console.log("the new file should be: " + newfile)
      gulp.src(folder.build + 'html/**/*.html')
            .pipe(replace(oldfile, newfile))
            .pipe(gulp.dest('build/html'));
   }
       
  return oldfile;
});

gulp.task('htmlupdate', function () {
  var newfile = findValueInManifest(mainjsfile, mymanifestfile) //this isn't getting new file
  console.log("the new file should be: " + newfile)
  gulp.src(folder.build + 'html/**/*.html')
      .pipe(replace(oldfile, newfile))
      .pipe(gulp.dest('build/html'));
  return;
})

gulp.task('hello',['htmlupdate'], function(){
  console.log("done")
})
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
  //delete existing built css file
  if(fs.exists(mymanifestfile)){
    var oldfile = findValueInManifest('main.css', mymanifestfile)
    if(oldfile != null){
      fs.unlinkSync('build/css/' + oldfile);
      console.log('successfully deleted build/css/' + oldfile);
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
});

// watch for changes
gulp.task('watch', ['html'], function() {
  //html changes
  gulp.watch(folder.src + 'html/**/*', ['html']);
  // javascript changes
  gulp.watch(folder.src + 'js/**/*', ['html']);
  // css changes
  gulp.watch(folder.src + 'css/**/*', ['html']);
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
    name = name.slice(0, -1) + ".js";	
    return name;
}