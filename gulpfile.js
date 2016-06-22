/**
 * Gulp build file for js-alert
 *
 *	Usage:
 *
 *		npm run build
 *
 *
 *	To watch for changes and rebuild:
 *
 *		npm run watch
 *
 */
 
// Dependencies
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var browserify = require('browserify');
var babelify = require('babelify');
var uglify = require("gulp-uglify");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var babel = require('gulp-babel');
var del = require('del');

// Gulp default action, build the project
gulp.task("default", ["build"]);

// Gulp clean action, deletes the generated code folders
gulp.task("clean", function() {
	
	// Delete folders
	return del([
		"lib",
		"dist"
	]);
	
});

// Gulp build action, build the JavaScript and puts the compiled file into ./dist
gulp.task("build", ["clean"], function() {
	
	// Browserify it
	return browserify({
		entries: './src/index.js',
		debug: true,
		standalone: "JSAlert"
	})
	
	// Do babelify transforms
	.transform(babelify, {presets: ["es2015"], plugins: ["add-module-exports"]})
	
	// Create a single bundle file
	.bundle()
	
	// Catch errors
	.on('error', function(e) {
		
		// Show the error at the end of the log, easier to notice it that way
		setTimeout(function() {
			gutil.log(gutil.colors.red("ERROR: "), e.message);
		}, 1);
		
		// End the stream
		this.emit("end");
		
    })
	
	// Set output name
	.pipe(source('jsalert.min.js'))
	
	// Convert to a buffered file object
	.pipe(buffer())
	
	// Start creating the sourcemap file
	.pipe(sourcemaps.init({loadMaps: true}))
	
	// Minify it
	.pipe(uglify())
	
	// Output the sourcemaps
	.pipe(sourcemaps.write("."))
	
	// Output to the dist folder
	.pipe(gulp.dest("dist"))
	
});

// Gulp test action. This builds the project, and then tests it by importing it and checking if it can be created.
gulp.task("test", ["build"], function() {
	
	// Create an alert to test. If not in a browser, this should just output a message to the console.
	var JSAlert = require("./dist/jsalert.min.js");
	JSAlert.alert("Test successful!");
	
});

// Gulp watch action, watch for changes and rebuild the project each time
gulp.task("watch", ["default"], function() {

	var watcher = gulp.watch("src/**/*", ["default"]);
	watcher.on("change", function(event) {
		console.log("File " + event.type + ": " + event.path);
	});
	console.log("Watching for changed files...");
	
});

// Gulp task started before publishing to NPM.
gulp.task("prepublish", ["generate-lib", "build"]);

// Gulp task to generate the lib files. The lib is basically an es5 version of the source. The lib folder gets uploaded to NPM. */
gulp.task("generate-lib", ["clean"], function() {
	
	// Get source files
	return gulp.src("src/**/*")
	
	// De-ES6ify with babel
	.pipe(babel({
		presets: ['es2015'],
		plugins: ['add-module-exports']
	}))
	
	// Output to lib folder
	.pipe(gulp.dest('lib/'));
	
});