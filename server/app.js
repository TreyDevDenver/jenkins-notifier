/**
 * Module dependencies
 */
var express = require('express');
var app = express();
var socket = express();
var routes = require('./routes');
var user = require('./routes/user');
var path = require('path');
var http = require('http');
// Custom modules
var io = require('./socketserver');
//var jenkins = require('./jenkins-api');
var port = process.env.PORT || 3000;
/**
 * Configure server settings
 */
// Web (http) Server Settings...
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// Socket server settings...
socket.set('port', process.env.PORT || 6456);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/**
 * Set routes / set exports
 */
//app.get('/', routes.index);
app.get('/', express.static(__dirname + '/public/index.html'));
app.get('/simple', express.static(__dirname + '/public/simple.html'));
//app.get('/users', user.list);

/**
 * Start Services
 */
// Web (http) server startup...
http.createServer(app).listen(app.get('port'));
// Start Jenkins...
// jenkins.start({}, function(data){
// 	console.log('returned jenkins data', data);
// });
// Socket server startup...
io.startServer(socket);
