// Load plugins
import autoprefixer from "gulp-autoprefixer";
import browserSyncLib from "browser-sync";
const browsersync = browserSyncLib.create();
import cleanCSS from "gulp-clean-css";
import del from "del";
import gulp from "gulp";
import header from "gulp-header";
import merge from "merge-stream";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
import terser from "gulp-terser";
import imagemin from 'gulp-imagemin';

const sassCompiler = gulpSass(sass);

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function cleanVendor() {
  return del(["./vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest('./vendor/bootstrap'));
  // Font Awesome CSS
  var fontAwesomeCSS = gulp.src('./node_modules/@fortawesome/fontawesome-free/css/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/css'));
  // Font Awesome Webfonts
  var fontAwesomeWebfonts = gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/**/*')
    .pipe(gulp.dest('./vendor/fontawesome-free/webfonts'));
  // jQuery Easing
  var jqueryEasing = gulp.src('./node_modules/jquery.easing/*.js')
    .pipe(gulp.dest('./vendor/jquery-easing'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'));
  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery, jqueryEasing);
}

// CSS task
function cssTask() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sassCompiler({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sassCompiler.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}

// JS task
function jsTask() {
  return gulp
    .src([
      './js/*.js',
      '!./js/*.min.js',
      // Additional exclusions can be added here
    ])
    .pipe(terser())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('dist/js/'))
    .pipe(browsersync.stream());
}

function imagesTask(done) {
  gulp.src('img/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/img/'))
  done();
}

// Watch files
function watchFiles() {
  gulp.watch("./scss/**/*", cssTask);
  gulp.watch(["./js/**/*", "!./js/**/*.min.js"], jsTask);
  gulp.watch("./**/*.html", browserSyncReload);
  gulp.watch("./img/**/*", imagesTask);
}

// Define complex tasks
const vendorTask = gulp.series(cleanVendor, modules);
const buildTask = gulp.series(vendorTask, gulp.parallel(cssTask, jsTask, imagesTask));
const watchTask = gulp.series(buildTask, gulp.parallel(watchFiles, browserSync));

// Export tasks
export const css = cssTask;
export const js = jsTask;
export const clean = cleanVendor;
export const vendor = vendorTask;
export const build = buildTask;
export const watch = watchTask;
export const minifyImages = imagesTask;
export default build;
