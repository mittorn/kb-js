var twitter = require('ntwitter');


var twit = require('../matrix-bot-config.js').twitter;

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(twit.sqliteDatabase);


exports.runQuery = function(matrix, query, querySender, queryRoom) {
  var hostMatch, traceroute;

  console.log('Twitter: Received query "' + query + '"...\n');
  if(query && (req = query.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g))) {
    if(req[0] === 'follow') {

    } else if(req[0] === 'unfollow') {

    } else if(req[0] === 'track') {

    } else if(req[0] === 'untrack') {

    } else {
      matrix.sendNotice(queryRoom.roomId, 'I did not understand this request. Call !help twitter for more details.');
    }
  }
};

exports.getHelp = function(details) {
  return 'TODO';
};

// Ok, start this process to run regularly.
var currentFeed = { 'track': {}, 'follow': {} };

var establishFeed = function(matrix) {
  // Ok, first we need to determine which keywords we need to request
  var newFeed = { 'track': {}, 'follow': {} };
  var isMissing = false;
  db.each("SELECT twitter_type, twitter_keywords, room_id, requestor, requested_at FROM twitter_streams WHERE active=1", function(err, row) {
    // TODO -> also account for rooms I am no longer in!
    if(!newFeed[row['twitter_type']][row['twitter_keywords']]) {
      newFeed[row['twitter_type']][row['twitter_keywords']] = new Array();
    }

    newFeed[row['twitter_type']][row['twitter_keywords']].push(row['room_id']);

    if(!currentFeed[row['twitter_type']][row['twitter_keywords']]) {
      isMissing = true;
    }
  });

  if(isMissing) {
    // TODO
  } else {
    currentFeed = newFeed;

    // We update the feed every ten minutes to avoid hitting the Twitter API too often
    setTimeout(function() { return establishFeed(matrix); }, 600000);
  }

};

exports.runSetup = function(matrix) {
  return establishFeed(matrix);
};