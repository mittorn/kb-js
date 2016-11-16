// Loading our configuration file
var config = require('./matrix-bot-config.js').base;

// matrix-js-sdk
var sdk = require("matrix-js-sdk");
var matrixClient = sdk.createClient({
  baseUrl: config.botBaseUrl,
  accessToken: config.botAccessToken,
  userId: config.botUserId
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
  if (member.membership === "invite" && member.userId === config.botUserId) {
  	console.log("Received invite for %s from %s. Auto-joining...", member.roomId, event.getSender());
  	
    matrixClient.joinRoom(member.roomId)
       .then(function() {
         console.log("Auto-joined %s", member.roomId);
       })
       .catch(function(err) {
       	 console.log("Could not join room %s because of an error:", member.roomId);
       	 console.log(err);
       })
       .done();
  }
});


// Listen for messages starting with a bang (!)
matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
  if (toStartOfTimeline || event.getUnsigned().age > (3*60*1000) || event.getSender() === config.botUserId) {
    return; // don't use results older than three minutes or own data
  }
  if (event.getType() !== "m.room.message") {
    return; // only use messages
  }

  // Log to console
  console.log(
    // the room name will update with m.room.name events automatically
    "(%s) %s :: %s", room.name, event.getSender(), event.getContent().body
  );

  console.log('Event data:' + JSON.stringify(event.getUnsigned()));


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

// We use the default initialSyncLimit of 8 as it is also used for subsequent requests
// However, we ignore messages older than 3 minutes (see above) to avoid replying to stale requests
matrixClient.startClient({ });


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
app.set('view engine', 'pug');


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

