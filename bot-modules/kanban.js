// Configuration
var config = require('../matrix-bot-config.js').kanban;


// Let's go...
var request = require('request');
var sqlite3 = require('sqlite3').verbose();
var q = require('q');

var db = new sqlite3.Database(config.sqliteDatabase);

// From: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
var getGUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var getUserKey = function(matrix_user, emptyIsOk) {
  var deferred = q.defer();

  db.get("SELECT domain, api_key FROM api_keys WHERE matrix_user = ?", matrix_user, function(err, row) {
    if(err) {
      deferred.reject('A database error occured: ' + err);
    } else if(row && row['api_key'] && row['domain']) {
      deferred.resolve(row);
    } else {
      if(emptyIsOk) {
        deferred.resolve(undefined);
      } else {
        deferred.reject('You do not have a stored API key. Please login first.');
      }
    }
  });

  return deferred.promise;
};

var findKanbanBoard = function(matrix_user, search) {
  var deferred = q.defer();

  getUserKey(matrix_user).then(
    function(userKey) {
      console.log('Kanban API request: https://' + userKey.domain + '.kanbantool.com/api/v1/boards.json?api_token=' + encodeURIComponent(userKey.api_key));
      request({ url: 'https://' + userKey.domain + '.kanbantool.com/api/v1/boards.json?api_token=' + encodeURIComponent(userKey.api_key), json: true, method: 'GET' },
        function(err, res, body) {
          if(err || !Array.isArray(body)) {
            console.log('Kanban Tool API error:');
            console.log(err);
            console.log('Kanban Tool API response body:');
            console.log(body);
            deferred.reject('An error occured accessing the Kanban Tool API.');
          } else {
            console.log('Kanban Tool API response:');
            console.log(body);

            var relevantBoards = body.filter(function(d) {
              return (d['board']['name'].toUpperCase().indexOf(search.toUpperCase()) >= 0);
            });

            if(relevantBoards.length === 0) {
              deferred.reject('I am sorry, but I could not find a board with the given name.');
            } else if(relevantBoards.length > 1) {
              deferred.reject('I found multiple boards with the given name:\n- ' + relevantBoards.map(function(d) { return d['board']['name']; }).join('\n- ') + '\nPlease specify the exact name of the board to be used.');
            } else {
              deferred.resolve({
              	domain: userKey.domain,
              	apiKey: userKey.api_key,
              	boardId: relevantBoards[0]['board']['id'],
              	boardName: relevantBoards[0]['board']['name']
              });
            }
          }
        }
      );
    },
    function(err) {
      deferred.reject(err);
    }
  );

  return deferred.promise;
};



exports.runQuery = function(matrix, query, querySender, queryRoom) {
  var req;

  console.log('Kanban: Received query "' + query + '"...');
  if(query && (req = query.match(/(".*?"|[^"\s]+)(?=\s*|\s*$)/g))) {
    if(req[0] == 'login') {
      // Login if not already logged in
      // Login means that the user is asked to submit his/her API token

      getUserKey(querySender, true)
        .then(
          function(api_key, domain) {
            var deferred = q.defer();

            if(api_key) {
              // Already logged in...
              deferred.reject('You are already logged in. Please logout first before trying to login again.');
            } else {
              // Ok, not yet logged in.

              // Add new auth request and return URL for logging into Kanban...
              var auth_request = getGUID();

              db.run("INSERT INTO auth_requests (id, matrix_user, room_id, requested_at) VALUES (?, ?, ?, ?)", auth_request, querySender, queryRoom.roomId, new Date(), function(err) {
                if(err) {
                  console.log('An error occured with SQLite3: ' + err);
                  deferred.reject('An error occured obtaining the authentication request.');
                } else {
                  // Return the URL the user can use to authenticate with Wunderlist...
                  deferred.resolve('Please provide your Kanban API token here: ' + config.myServer + 'login?auth_request=' + encodeURIComponent(auth_request));
                }
              });
            }

            return deferred.promise;
          }
        )
        .then(
          function(res) {
            matrix.sendNotice(queryRoom.roomId, res);
          },
          function(err) {
            matrix.sendNotice(queryRoom.roomId, err);
          }
        );

    } else if(req[0] == 'logout') {
      // Logout = deleting the stored authentication token
      db.run('DELETE FROM api_keys WHERE matrix_user=?', querySender, function(err) {
        if(err) {
          console.log('Database error when removing API key: ' + err);
          matrix.sendNotice(queryRoom.roomId, 'An error occured while trying to remove your Kanban TOol API key from our database. Please try again later.');
        } else {
          matrix.sendNotice(queryRoom.roomId, 'Your Kanban TOol API key has been removed from our database.');
        }
      });

    } else if(req[0] == 'add') {
      // Add new card to Kanban board
      if(!req[1] || !req[2]) {
        matrix.sendNotice(queryRoom.roomId, 'You have to specify board list to be added to and the text of the item.'); // TODO: support default boards
      } else {
        var boardSearch = req[1].match(/^"?(.*?)"?$/)[1];
        var itemToAdd = req[2].match(/^"?(.*?)"?$/)[1];

        // If there is text that is not escaped with quotes, add it to the task title anyways
        for(var i = 3;i < req.length;i++) {
          itemToAdd += ' ' + req[i];
        }

        findKanbanBoard(querySender, boardSearch).then(
          function(boardData) {
            var deferred = q.defer();

            request({
              method: 'POST',
              url: 'https://' + boardData.domain + '.kanbantool.com/api/v1/boards/' + boardData.boardId + '/tasks.json?api_token=' + boardData.apiKey,
              json: true,
              body: {
                task: {
                  name: itemToAdd
                }
              }
            }, function(err, res) {
              if(err) {
                console.log('Kanban Tool API error:');
                console.log(err);
                deferred.reject('An error occured trying to add the task to your board.');
              } else {
                deferred.resolve('[' + boardData.boardName + '] ' + itemToAdd);
              }
            });

            return deferred.promise;
          }
        ).then(
          function(res) {
            console.log('Kanban task successfully added:');
            console.log(res);
            matrix.sendNotice(queryRoom.roomId, res);
          },
          function(err) {
            console.log('Kanban error: ' + err);
            matrix.sendNotice(queryRoom.roomId, err);
          }
        );
      }

    } else if(req[0] == 'follow') {
      // Start monitoring Kanban board for changes

      // TODO

    } else if(req[0] == 'unfollow') {
      // Stop monitoring Kanban board for changes

      // TODO

    }
  }
};


var getAuthRequest = function(auth_request) {
  var deferred = q.defer();

  db.get('SELECT * FROM auth_requests WHERE id = ?', auth_request, function(err, row) {
    if(row && row['matrix_user']) {
      // Ok
      deferred.resolve(row);
    } else {
      deferred.reject('Authentication request invalid. Please try again in Matrix.');
    }
  });

  return deferred.promise;
}

exports.webRequest = function(matrix, path, query, res) {
  console.log('Kanban-Tool - Received web request for ' + path);

  if(path === 'login' && query['auth_request']) {
    getAuthRequest(query['auth_request']).then(
      function(auth_request) {
        res.render('kanban/login_form', { auth_request: auth_request['id'], matrix_user: auth_request['matrix_user'] });
      },
      function(err) {
        res.send(err);
      }
    );
  } else if(path === 'do_login' && res.req.body['auth_request']) {
    if(res.req.body['api_key'] && res.req.body['domain'].match(/^[a-zA-Z0-9\-]+$/)) {
      var myDomain = res.req.body['domain'];
      var myApiKey = res.req.body['api_key'];	
    	
      getAuthRequest(res.req.body['auth_request'])
        .then(
          function(auth_request) {
            deferred = q.defer();

            // Test API key
            request.get({url: 'https://' + myDomain + '.kanbantool.com/api/v1/boards.json?api_token=' + encodeURIComponent(myApiKey), method: 'GET', json: true},
              function(err, result, body) {
                if(err || (body && body['status'] && body['status'] >= 400)) {
                  console.log('An error occured testing API key with request: ' + err);
                  deferred.reject('Your API key or domain are not valid.');
                } else {
                  console.log(result);
                  console.log(body);
                  deferred.resolve(auth_request);
                }
              }
            );

            return deferred.promise;
          }
        )
        .then(
          function(auth_request) {
            deferred = q.defer();

            db.run('INSERT INTO api_keys (matrix_user, domain, api_key, stored_at) VALUES (?, ?, ?, ?)', auth_request['matrix_user'], myDomain, myApiKey, new Date(), function(err) {
              if(err) {
                console.log('Database error while adding Kanban API keys to database: ' + err);
                deferred.reject('An error occured adding your API keys to our database. Please try again later.');
              } else {
              	db.run('DELETE FROM auth_requests WHERE id=?', auth_request['id']);
                deferred.resolve(auth_request);
              }
            });

            return deferred.promise;
          }
        )
        .then(
        function(auth_request) {
          matrix.sendNotice(auth_request['room_id'], 'Your Kanban Tool API key has been saved.');
          res.send('Your Kanban Tool API key has been saved and you can now return to Matrix.');
        },
        function(err) {
          console.log('An error occured: ' + err);
          res.send(err);
        }
      );
    } else {
      res.send('You have to specify a valid domain and API key.');
    }
  } else {
  	console.log('Kanban: Received unknown command.');
  	console.log(res.req.body);
    res.send('Unknown command.');
  }
};

exports.runSetup = function(matrix) {
  // TODO - start monitoring for defined "follow"s
};

exports.getHelp = function(details) {
  return 'You can use !kanban login (ideally in a private room) to authorize me to access your Kanban board (from kanbantool.com). Afterwards you can use the following features:\n' +
         '!kanban add <Board> <Task Description> - Will add the task to the left-most, up-most part of the given <Board>.\n' +
         '!kanban follow <Board> - Will monitor the given board for changes (has a 1 minute delay as we do not monitor the boards more often).\n' +
         '!kanban unfollow <Board> - Will stop monitoring the given board for changes.';
};
