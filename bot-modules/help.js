///// CONFIGURATION OF HELP MODULES

var helpModules = {};

var traceroute = require("./traceroute.js");
helpModules['traceroute'] = traceroute.getHelp;


exports.runQuery = function(client, query, querySender, queryRoom) {
  var params, line;

  console.log('Helped called for ' + query);

  if(query && (params = query.match(/([a-zA-Z0-9]+)( (.+))?/))) {
    if(helpModules[params[1]]) {
      line = helpModules[params[1]](params[3]);
    } else {
      line = 'Hello there! Unfortunately, the module "' + params[1] + '" does not yet exist...';
    }
  } else {
    line = '[ КОМАНДЫ ]\n\n';

    Object.keys(helpModules).forEach(function(k) {
      line += 'кб ' + k + '\n';
    });
    
    line += '\nХозяин бота - @mittorn:matrix.org';
  }

  console.log(line);
  client.sendBotNotice(queryRoom.roomId, line);
};
