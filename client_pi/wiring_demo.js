var wpi = require('wiring-pi');
wpi.setup('gpio');

/*
Pinout
Gnd/White --> Ground
D0/Blue --> GPIO #10 (MOSI)
L0/Green --> GPIO #8 (CE0)
E0/Yellow --> Ground
C0/Black --> GPIO #11 (CLK)
V+/Red --> Power
GPIO #9 is MISO and is unused.
 */

wpi.pwmSetMode(wpi.PWM_MODE_BAL);

wpi.pinMode(11, wpi.GPIO_CLOCK);
wpi.pinMode(10, wpi.PWM_OUTPUT);
wpi.pinMode(8, wpi.OUTPUT);

var testInterval = setInterval(function () {
	var randColor = Math.floor((Math.random()*255));
	console.log('Set color to ' + randColor);
	wpi.pwmWrite(10, randColor);
}, 1000);