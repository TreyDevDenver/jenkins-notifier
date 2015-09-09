var config = require('./config');
var socket = require('socket.io');
var path = require('path');
var request = require('request');

var jenkins = require('jenkins')(config.jenkins.serverUrl + '/job/'
	+ config.jenkins.projectName + '/api/json');
var lastBuild = null;

/**
 * Start socket server.
 *
 * Begins the Jenkins polling.
 * Provides socket communications to the server dashboard.
 */
module.exports.startServer = function(app) {
	io = socket.listen(app.get('port'));


	// Provides socket communications to the server dashboard on client connect.
	io.sockets.on('connection', function(clientSocket) {

		clientSocket.emit('announcement', {
			type: 'build-number',
			data: (typeof lastBuild !== null && lastBuild) ? lastBuild : 'No Recent Builds!'
		});

		clientSocket.on('user', function(msg) {
			if(msg === 'bleh') {
				clientSocket.emit('message', {
					type: 'message',
					data: 'BLEH 2 U'
				});
			}else{
				clientSocket.emit('message', {
					type: 'message',
					data: 'STOP SPAMMING ME.'
				});
			}
		});
	});

	// Begin polling of jenkins api...
	var jenkinsPoll = setInterval(function() {
		jenkins.get( function(err, data) {
			// If jenkins api call errors out, halt
			if (err) {
				throw new Error(err);
			}

			// Ensure we have the jenkins latest build data to continue...
			var lastBuildNumber = false;
			if (typeof data.lastBuild['number'] == 'undefined') {
				throw new Error('Last build data was not sent back from Jenkins API call. Abort process.');
			}

			lastBuildNumber = data.lastBuild['number'];
			// If the build number has changed, process further...
			if (lastBuildNumber !== lastBuild) {
				// Get lastest build info
				var buildPath = [config.jenkins.serverUrl, 'job', config.jenkins.projectName, lastBuildNumber, 'api', 'json'].join('/');
				request(buildPath, function(err, res) {
					// Ensure we do not encounter an error
					// Also ensure an object was sent back
					if (err) {
						throw new Error(err);
					} else if (typeof res !== 'object') {
						throw new Error('Jenkins API call did not return JSON.');
					}

					// Try to parse data into a json obj so that we may continue to process
					var jenkinsData = {};
					try {
						jenkinsData = JSON.parse(res.body);
					}
					catch (err) {
						throw new Error(err);
					}

					// If the latest build number is currently in process of building
					// let the connected clients know this, else send the result (SUCCESS/FAIL)
					if (typeof jenkinsData.building !== 'undefined'
						&& jenkinsData.building) {
						io.sockets.emit('jenkins-res', {
							result: 'BUILDING',
							buildDisplay: config.jenkins.projectName,
							timestamp: new Date()
						});
					} else {
						io.sockets.emit('jenkins-res', {
							result: jenkinsData.result,
							buildDisplay: jenkinsData.fullDisplayName,
							timestamp: jenkinsData.timestamp
						});
					}

					// Update the global last build number
					// This will allow use to monitor the state of the build
					lastBuild = lastBuildNumber;

					// Send all clients connected to the dashboard the latest announcement
					var culprits = [];
					if (typeof jenkinsData.culprits !== 'undefined') {
						for (var culprit in jenkinsData.culprits) {
							if (typeof jenkinsData.culprits[culprit]['fullName'] !== 'undefined') {
								var nameParts = jenkinsData.culprits[culprit]['fullName'].split(' ')
								culprits.push(nameParts[0]);
							}
						}
					}
					io.sockets.emit('announcement', {
						name: config.jenkins.projectName,
						buildNumber: lastBuild,
						culprits: culprits,
						timeStamp: jenkinsData.timestamp,
						result: (jenkinsData.building) ? 'BUILDING' : jenkinsData.result
					});

					// Here for testing... to always trigger a "new build"
					// Remove or comment out to actually begin monitoring
					lastBuild++;
				});
			}
		});
	}, config.jenkins.pollingDelay * 1000);



	return io;
};
