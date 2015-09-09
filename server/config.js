var config = {};

config.app = {};
config.jenkins = {};

config.app.port = process.env.PORT || 3000;

config.jenkins.projectName = 'SSP';
config.jenkins.serverUrl = 'http://10.1.10.199:8080';
config.jenkins.pollingDelay = 5;

module.exports = config;