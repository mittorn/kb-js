// This file contains all configuration options for the individual
// modules

exports.base = {
  'botBaseUrl':       'https://matrix.org',
  'botUserId':        '<insert matrix user ID here>',
  'botAccessToken':   '<insert matrix access token here>'
};


// For bitmessage module
exports.bitmessage = {


};


// For calculate module
exports.calculate = {
  'wolframApiKey': '<insert Wolfram Alpha API key here>'
};


// For kanban module
exports.kanban = {
  'myServer':       '<insert URL for your hello-matrix-webinterface here>',
  'sqliteDatabase': 'kanban.sqlite'
};


// For twitter module
exports.twitter = {
  consumer_key: '<insert Twitter consumer key here>',
  consumer_secret: '<insert Twitter consumer secret here>',
  access_token_key: '<insert Twitter access token key here>',
  access_token_secret: '<insert Twitter access token secret here>',
  sqliteDatabase: 'twitter.sqlite'
};


// For weather module
exports.weather = {
  'weatherApiKey': '<insert OpenWeatherMap API key here>'
};


// For wunderlist module
exports.wunderlist = {
  'myServer':                '<insert your webserver URL here (with https://)>',
  'myServerWunderlist':      '<insert your webserver URL here (http only)>',
  'wunderlistClientID':      '<insert wunderlist client ID here>',
  'wunderlistClientSecret':  '<insert wunderlist client secret here>',
  'sqliteDatabase':          'wunderlist.sqlite'
};

