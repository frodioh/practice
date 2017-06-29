var mongoose = require('mongoose');
var config = require('./config.json');
var options = {
      user: config.db.user,
      pass: config.db.password
    };
var host = config.db.host;
var port = config.db.port;
var db = config.db.name;

//Подключение
mongoose.connect(`mongodb://${host}:${port}/${db}`, options)
  .catch(function(e) {
    console.error(e);
    throw e;
});

module.exports = mongoose;