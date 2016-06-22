[![Build Status](https://travis-ci.org/jjv360/js-alert.svg?branch=master)](https://travis-ci.org/jjv360/js-alert)

# js-alert
A simple JavaScript alert manager.


## Use from the browser

The simplest way to use from the browser is to include the minified script:

``` html
<script src="https://npmcdn.com/js-alert/dist/jsalert.min.js"></script>
```


## Use from Node

To use this library in your node web app, first install the dependency:

```
npm install --save js-alert
```

Then you can use it in your project:

``` javascript
var JSAlert = require("js-alert");
```


## Usage examples

See all tests [here](https://rawgit.com/jjv360/js-alert/master/tests.html).

``` javascript
// Show a plain alert
JSAlert.alert("This is an alert.");
```

``` javascript
// Show an alert with a title and custom dismiss button
JSAlert.alert("Your files have been saved successfully.", "Files Saved", "Got it");
```

``` javascript
// Show multiple alerts (alerts are automatically queued)
JSAlert.alert("This is the first alert.");
JSAlert.alert("This is the second alert.");
JSAlert.alert("This is the third and final alert.");
```

``` javascript
// Automatically dismiss alert
JSAlert.alert("This will only last 10 seconds").dismissIn(1000 * 10);
```

``` javascript
// Event when dismissed
JSAlert.alert("This one has an event listener!").then(function() {
    console.log("Alert dismissed!");
});
```

``` javascript
// Show a confirm alert
JSAlert.confirm("Are you sure you want to delete this file?").then(function(result) {

    // Check if pressed yes
    if (!result)
        return;
    
    // User pressed yes!
    JSAlert.alert("File deleted!");

});
```

``` javascript
// Create an alert with custom buttons
var alert = new JSAlert("My text", "My title");
alert.addButton("Yes").then(function() {
    console.log("Alert button Yes pressed");
});
alert.addButton("No").then(function() {
    console.log("Alert button No pressed");
});
alert.show();
```


## Building the library

To create a minified build of this library, run this:

```
npm run build
```

A built version of the library will be saved to the dist folder.