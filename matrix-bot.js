// Loading our configuration file
var config = require('./matrix-bot-config.js').base;

// We define various helper functions for Matrix in matrix-bot-client.js...
var client = require('./matrix-bot-client.js');


// matrix-js-sdk
var sdk = require("matrix-js-sdk");
client.matrixClient = sdk.createClient({
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
botModules['webhook'] = require("./bot-modules/webhook.js");
botModules['whois'] = require("./bot-modules/whois.js");
botModules['wunderlist'] = require("./bot-modules/wunderlist.js");



// Automatically join rooms when invited
client.matrixClient.on("RoomMember.membership", function(event, member) {
  if (member.membership === "invite" && member.userId === config.botUserId) {
  	console.log("Received invite for %s from %s. Auto-joining...", member.roomId, event.getSender());

    client.matrixClient.joinRoom(member.roomId)
       .then(function() {
         console.log("Auto-joined %s", member.roomId);
       })
       .catch(function(err) {
       	 console.log("Could not join room %s because of an error:", member.roomId);
       	 console.log(err);

         // We leave (=reject invite) rooms that cannot be joined because they have no users left.
         if(err.message === 'No known servers') {
           console.log('We reject invite for room (' + member.roomId + ') we will not be able to join...');
           return matrixClient.leave(member.roomId);
         }
       }).catch(function(err) {
         // Unexpected error
         console.log('An error occured while trying to reject / process room invites:' + JSON.stringify(err));
       })
       .done();
  } else if(member.userId === config.botUserId) {
    console.log("Received UNPROCESSED membership event of type %s for myself in room %s from %s.", member.membership, member.roomId, event.getSender());

    // TODO: Enable processing of other events (kicks, bans, etc.)
  }
});



client.matrixClient.once('sync', function(state, prevState) {
  if(state === 'PREPARED') {
    // Ok, we are ready to listen to new messages and to perform initial set-up.

    // Listen for messages starting with a bang (!)
    client.matrixClient.on("Room.timeline", function(event, room, toStartOfTimeline) {
      if (toStartOfTimeline || event.getSender() === config.botUserId) {
        return; // don't use stale results or own data
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
          botModules[botCommand[1]].runQuery(client, botCommand[3], event.getSender(), room);
        }
      }
    });


    // Find rooms.
    console.log('We are participating in the following rooms:');
    client.matrixClient.getRooms().forEach(function(room) {
      console.log(' - %s (%s)', room.name, room.roomId);
    });


    // Initialise modules where required
    Object.keys(botModules).forEach(function(module) {
      if (botModules[module]['runSetup']) {
        botModules[module].runSetup(client);
      }
    });




  } else {
    // Something went wrong. We exit.
    console.log('Matrix SYNC did not progress into the expected PREPARED phase (new sync state %s from %s). We exit.', state, prevState);
    process.exit(1);
  }
});

// We use the default initialSyncLimit of 8 as it is also used for subsequent requests
// However, we ignore messages older than 3 minutes (see above) to avoid replying to stale requests
client.matrixClient.startClient({ });





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
    botModules[path[1]].webRequest(client, path[2], req.query, res);
  } else {
    res.send('Path ' + req['params'] + ' is unknown.');
  }
});

// Web interfaces for the individual modules - POST
app.post('/matrix-bot/*', function (req, res) {
  var path = req.params[0].match(/([a-z]+?)\/(.*)/);

  if(path && botModules[path[1]] && botModules[path[1]]['webRequest']) {
    console.log('Run web request module for ' + path[1] + '...');
    botModules[path[1]].webRequest(client, path[2], req.query, res);
  } else {
    res.send('Path ' + req['params'] + ' is unknown.');
  }
});


app.listen(3001, 'localhost', function () {
  console.log('Web app listening on localhost:3001!');
});

