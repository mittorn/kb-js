var sdk = require("matrix-js-sdk");
var client = sdk.createClient("https://matrix.org");

var config = require('./matrix-bot-config.js').base;

var matrixClient = sdk.createClient({
  baseUrl: base.botBaseUrl,
  accessToken: base.botAccessToken,
  userId: base.botUserId
});


///// CONFIGURATION OF BOT-MODULES

var botModules = {};

botModules['bitmessage'] = require("./bot-modules/bitmessage.js");
botModules['calculate'] = require("./bot-modules/calculate.js");
botModules['dice'] = require('./bot-modules/dice.js');
botModules['help'] = require("./bot-modules/help.js");
botModules['kanban'] = require("./bot-modules/kanban.js");
botModules['traceroute'] = require("./bot-modules/traceroute.js");
botModules['weather'] = require("./bot-modules/weather.js");
botModules['whois'] = require("./bot-modules/whois.js");
botModules['wunderlist'] = require("./bot-modules/wunderlist.js");



// Automatically join rooms when invited
matrixClient.on("RoomMember.membership", function(event, member) {
  if (member.membership === "invite" && member.userId === myUserId) {
    matrixClient.joinRoom(member.roomId).done(function() {
      console.log("Auto-joined %s", member.roomId);
    });
  }
});


// Listen for messages starting with a bang (!)
matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
  if (toStartOfTimeline || event.getSender() === myUserId) {
    return; // don't use old results or own data
  }
  if (event.getType() !== "m.room.message") {
    return; // only use messages
  }

  // Log to console
  console.log(
    // the room name will update with m.room.name events automatically
    "(%s) %s :: %s", room.name, event.getSender(), event.getContent().body
  );

  // Is it a bang?
  var botCommand;
  if(botCommand = event.getContent().body.match(/!([a-z]+)( (.+))?/)) {
    // Log to console
    console.log('Bang match: ' + botCommand[1] + ' ' + botCommand[3]);

    if(botModules[botCommand[1]]) {
      // Log to console
      console.log('Module found for ' + botCommand[1] +'. Executing...');

      // Run relevant module
      botModules[botCommand[1]].runQuery(matrixClient, botCommand[3], event.getSender(), room);
    }
  }
});

// 0 = We do not want old messages
matrixClient.startClient({ initialSyncLimit: 1 });

// Initialise modules where required
Object.keys(botModules).forEach(function(module) {
  if (botModules[module]['runSetup']) {
    botModules[module].runSetup(matrixClient);
  }
});



//////////////// WEB INTERFACE ///////////////////

var express = require('express');
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Jade views
app.set('views', './bot-views');
app.set('view engine', 'jade');


// Hello World
app.get('/', function (req, res) {
  res.send('Hello World!');
});

// Web interfaces for the individual modules - GET
app.get('/matrix-bot/*', function (req, res) {
  var path = req.params[0].match(/([a-z]+?)\/(.*)/);

  if(path && botModules[path[1]] && botModules[path[1]]['webRequest']) {
    console.log('Run web request module for ' + path[1] + '...');
    botModules[path[1]].webRequest(matrixClient, path[2], req.query, res);
  } else {
    res.send('Path ' + req['params'] + ' is unknown.');
  }
});

// Web interfaces for the individual modules - POST
app.post('/matrix-bot/*', function (req, res) {
  var path = req.params[0].match(/([a-z]+?)\/(.*)/);

  if(path && botModules[path[1]] && botModules[path[1]]['webRequest']) {
    console.log('Run web request module for ' + path[1] + '...');
    botModules[path[1]].webRequest(matrixClient, path[2], req.query, res);
  } else {
    res.send('Path ' + req['params'] + ' is unknown.');
  }
});


app.listen(3001, 'localhost', function () {
  console.log('Web app listening on localhost:3001!');
});

