/**
 * Gulp build file for js-alert
 *
 *	Usage:
 *
 *		npm install
 *		npm run gulp
 *
 *
 *	To watch for changes and rebuild:
 *
 *		npm run gulp watch
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


// Gulp default action, build the project
gulp.task("default", ["build"]);

// Gulp build action, build the JavaScript and puts the compiled file into ./dist
gulp.task("build", function() {
	
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