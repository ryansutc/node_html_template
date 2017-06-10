# node_html_template
## Vanilla Template Setup of HTML, SASS and Node with Gulp Configuration

Used to test out a basic node web project:
* using npm for javascript libraries (ie. fullcalendar.js, jquery)
* using Gulp as a taskrunner to build project for dev and production
* using browserify to package up node javascript for use on a basic server
* using watchify to monitor javascript and auto-repack during development

Hoping this will be the standard workflow for vanilla HTML projects

### Setup

Make sure you have Node and NPM installed.
Then install Gulp, Browserify and Watchify installed globally

```
npm install gulp-cli -g
npm install -g browserify

```

### To Run

Make sure you have run npm install to get required modules. 
To make a build of your project with gulp do:
```
gulp build
```
To build AND auto-update your changes developing on a file server do (default):
```
gulp
```
NEW:
To build and auto-update your changes AND load in an http webserver do:
```
gulp web
```
