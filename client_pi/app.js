// required packages
var client = require('socket.io-client'),
	gpio = require("gpio");

// configuration
var username = 'I_AM_LAZY', // your username to send to the server
	serverUrl = 'http://10.10.100.73:6456';

// other vars
var lightChangeInterval,
	lightChangeIndex,
	lightsOn,
	currentStatus = 'UNKNOWN',
	buildName = 'UNKNOWN';

// configure failure light on pin 25
var lightFail = gpio.export(25, {
	direction: 'out',
	interval: 200,
	ready: function() {
		// turn light off when ready
		lightFail.set(0);
	}
});

// configure success light on pin 23
var lightSuccess = gpio.export(23, {
	direction: 'out',
	interval: 200,
	ready: function() {
		// turn light off when ready
		lightSuccess.set(0);
	}
});

// Socket connection to the server.
var socket = client.connect(serverUrl);

/**
 * Handler for server connection
 */
socket.on('connect', function() {
	console.log('Connected to ' + serverUrl);

	// let the server know who we are
	socket.emit('user', username);

/**
 * Handler for "jenkins-res" events.
 * Includes:
 * { result: 'SUCCESS', (or 'BUILDING', or 'FAILED')
 * buildDisplay: 'SSP #518',
 * timestamp: 1396973902585 }
 */
	socket.on('jenkins-res', function(data) {
		// set the name of the project and latest build number
		if (data.buildDisplay) {
			buildName = data.buildDisplay;
		}
		console.log('Received data from server ' + data.result);

		// update build status
		updateStatus(data.result);
	});
});

/**
 * Update current build status and trigger change if it changed.
 */
function updateStatus(newStatus) {
	var oldStatus = currentStatus;
	currentStatus = newStatus;
	if (oldStatus != newStatus) {
		// turn off lights
		lightFail.set(0);
		lightSuccess.set(0);
		changeStatus(oldStatus);
	}
}

/**
 * Handler for change in build status.
 */
function changeStatus(oldStatus) {
	console.log(buildName + ' status changed from ' + oldStatus + ' to ' + currentStatus + '.');

	// trigger notification lights
	lightFail.set(0);
	lightSuccess.set(0);
	lightsOn = false;
	lightChangeIndex = 0;
	lightChangeInterval = setInterval(lightChange, 50);
}

/**
 * Callback for the lightChangInterval. Flash the lights a few times, then show the status.
 */
function lightChange() {
	lightChangeIndex++;
	if (lightChangeIndex > 10) {
		lightChangeIndex = 0;
		clearInterval(lightChangeInterval);
		lightNotify();
	} else {
		toggleLights();
	}
}

/**
 * Turn on success light for successful build, fail light for failure, or both for building.
 */
function lightNotify() {
	if (currentStatus == 'SUCCESS') {
		console.log('Notify SUCCESS');
		lightFail.set(0);
		lightSuccess.set();
	} else if (currentStatus == 'BUILDING') {
		// both lights on
		console.log('Notify BUILDING');
		lightFail.set();
		lightSuccess.set();
	} else {
		// fail
		console.log('Notify FAIL');
		lightFail.set();
		lightSuccess.set(0);
	}
}

/**
 * If light is on, turn it off. If light is off, turn it on.
 */
function toggleLights() {
	if (lightsOn) {
		lightFail.set(0);
		lightSuccess.set(0);
	} else {
		lightFail.set();
		lightSuccess.set();
	}
	lightsOn = !lightsOn;
}
