//Подключение модулей
var fs = require('fs');
var path = require('path');
var express = require('express');
var mime = require('mime');
var multiparty = require('multiparty');
var crypto = require('crypto');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var nodemailer = require('nodemailer');

var config = require('./config.json');
var bodyParser = require('body-parser');
//Подключение к базе
var mongoose = require('./mongoose');
//Модели
var User = require('./model').user;
var App = require('./model').app;
//Создание пользователя
User.remove({}, function(err) {
  if(!err) {
    var man = new User({
      login: "admin",
      password: "admin"
    });
    man.save(function(err) {
      if(!err) {
        User.findOne({}, function(err,doc) {
          if(!err) {
            console.log(doc);
          }
        });
      }
    });
  }
})
//Сервер
var app = express();

//Установка движка рендеринга
app.set('view engine', 'jade');
app.set('views', path.resolve(`./${config.http.publicRoot}/template`));

//app.use(express.static(path.resolve(config.http.publicRoot)));
app.use(bodyParser.json());

app.use(session({
  secret: 'coffee',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use('/admin.html', function(req, res, next){
  if(!req.session.isAdmin) {
    res.redirect('/');
  } else {
    next();
  }
});
//---------------------------

//Маршруты

//Маршруты для шаблонов
app.get(['/index.html', '/'], function(req,res) {
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.render('index');
});
app.get('/works.html', function(req,res) {
  var works = {
    work: null
  };
  var items = Work.find({},null,null, function(err, docs) {
    if(!err) {
      works.work = docs;
      res.setHeader('Content-Type', 'text/html; charset=utf8');
      res.render('works', works);
    }
  });
});
app.post('/auth', function(req,res) {
  console.log(req.body);
  var data = req.body;
  var password = crypto.createHash('md5').update(data.pass).digest('hex');
  User.findOne({
    "login": data.login,
    "password": password
  }, function(err, doc) {
    if(!err&&doc) {
      res.setHeader('Content-Type', 'application/json; charset=utf8');
      var content = {
        "isValid": true
      };
      req.session.isAdmin = true;
      res.send(JSON.stringify(content));
    } else {
      var content = {
        "isValid": false
      };
      res.send(JSON.stringify(content));
      res.end();
    }
  });
});
app.post('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});
app.get('/admin.html', function(req,res) {
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.render('admin');
});
//Остальные маршруты
app.get('/*', function(req, res) {
  //Сохранение имени файла
  var fileName = './site' + req.url;
  if(fileName === './site/') fileName = fileName + 'index.html';
  //Получение MIME-типа
  var mimeType = mime.lookup(fileName),
      charset = mime.charsets.lookup(mimeType);
  //Установка заголовков
  res.setHeader('Content-Type', mimeType + '; charset=' + charset);
  console.log(fileName);
  if(fs.existsSync(fileName)) {
    var content = fs.readFileSync(fileName, {encoding: charset});
    res.write(content);
  } else {
    var content = fs.readFileSync('./site/404.html', {encoding: 'utf8'});
    res.setHeader('Content-Type', 'text/html; charset=utf8');
    res.status(404);
    res.write(content);
  }
  res.end();
});
//AJAX запросы
// app.post('/skills', function(req,res) {
//   var data = req.body;
//   var counter = 0;
//   var counterValid = 0;
//   console.log(data);
//   for (var item in data) {
//     var buf = data[item];
//     for (var val in buf) {
//       console.log(buf[val]);
//       counter++;
//       if ((+buf[val]>=0)&&(+buf[val]<=100)) {
//         counterValid++;
//       }
//     }
//   }
//   if (counter===counterValid) {
//     var valid = {
//       "isValid": true
//     };
//     valid = JSON.stringify(valid);
//     res.setHeader('Content-Type', 'application/json; charset=utf8;');
//     res.end(valid);
//     var frontend = {
//       section: "frontend",
//       items: [
//         {
//           name: "html",
//           value: +data.frontend.html
//         },
//         {
//           name: "css",
//           value: +data.frontend.css
//         },
//         {
//           name: "js",
//           value: +data.frontend.js
//         }
//         ]
//     };
//     var workflow = {
//       section: "workflow",
//       items: [
//         {
//           name: "git",
//           value: +data.workflow.git
//         },
//         {
//           name: "gulp",
//           value: +data.workflow.gulp
//         },
//         {
//           name: "bower",
//           value: +data.workflow.bower
//         }
//       ]
//     };
//     var backend = {
//       section: "backend",
//       items: [
//         {
//           name: "php",
//           value: +data.backend.php
//         },
//         {
//           name: "nodejs",
//           value: +data.backend.nodejs
//         },
//         {
//           name: "mongodb",
//           value: +data.backend.mongodb
//         }
//       ]
//     };
//     Skill.findOne({ section: "frontend" }, function (err, doc){
//       if (!doc) {
//         var doc = new Skill(frontend);
//       } else {
//         doc.items = frontend.items;
//       }
//       doc.save();
//     });
//     Skill.findOne({ section: "workflow" }, function (err, doc){
//       if (!doc) {
//         var doc = new Skill(workflow);
//       } else {
//         doc.items = workflow.items;
//       }
//       doc.save();
//     });
//     Skill.findOne({ section: "backend" }, function (err, doc){
//       if (!doc) {
//         var doc = new Skill(backend);
//       } else {
//         doc.items = backend.items;
//       }
//       doc.save();
//     });
//   } else {
//     var valid = {
//       "isValid": false
//     };
//     valid = JSON.stringify(valid);
//     res.setHeader('Content-Type', 'application/json; charset=utf8;');
//     res.end(valid);
//   }
//
// });
//--------

//app.use(function(err,req,res,next) {
//  res.status(500);
//  res.render('error', {error: err.message});
//  console.error(err.message, err.stack);
//});

app.listen(config.http.port, config.http.host, function() {
  var uploadDir = path.resolve(config.http.publicRoot, 'upload');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  console.log('Server is up');
});