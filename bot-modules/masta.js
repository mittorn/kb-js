// Маста

var exec = require('child_process').exec;


exports.runQuery = function(client, query, querySender, queryRoom) {

    exec("./masta.sh", function (error, stdout, stderr) {
      var line = '';
      if (error !== null) {
        line = 'Ошибка масты: ' + stderr;
      } else {
        line = 'Маста:\n' + stdout;
      }

      console.log(line);
      client.sendBotNotice(queryRoom.roomId, line);
    });
};

exports.getHelp = function(details) {
  return 'Сервера Xash3D';
};
