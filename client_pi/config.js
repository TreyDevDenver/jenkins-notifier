var config = {};

config.app = {};
config.app.serverUrl = 'http://10.10.100.73:6456';
config.app.noLights = process.env.NOLIGHTS || false;

module.exports = config;