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
app.get('/admin.html', function(req,res) {
  res.setHeader('Content-Type', 'text/html; charset=utf8');
  res.render('admin', skills);
});
app.get('/blog.html', function(req,res) {
  var posts = {
    post: null
  }
  var items = Post.find({}, null, null, function(err, docs) {
    var months = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря'
    ];
    if (!err) {
      posts.post = docs;
      docs.forEach(function(item, index) {
        var mas = item.date.split('.');
        var cur = parseInt(mas[1])-1;
        var date = mas[0]+' '+months[cur]+' '+mas[2];
        posts.post[index].date = date;
      });
      res.setHeader('Content-Type', 'text/html; charset=utf8');
      res.render('blog', posts);
    }
  })
});

app.get('/about.html', function(req,res) {
  var skills = {
    "frontend": {
      "html": 0,
      "css": 0,
      "js": 0
    },
    "workflow": {
      "git": 0,
      "gulp": 0,
      "bower": 0
    },
    "backend": {
      "php": 0,
      "nodejs": 0,
      "mongodb": 0
    }
  };
  Skill.findOne({section: "frontend"}, function(err,doc) {
    if(!err) {
      skills.frontend.html = doc.items[0].value;
      skills.frontend.css = doc.items[1].value;
      skills.frontend.js = doc.items[2].value;
    }
    Skill.findOne({section: "workflow"}, function(err,doc) {
      if(!err) {
        skills.workflow.git = doc.items[0].value;
        skills.workflow.gulp = doc.items[1].value;
        skills.workflow.bower = doc.items[2].value;
      }
      Skill.findOne({section: "backend"}, function(err,doc) {
        if(!err) {
          skills.backend.php = doc.items[0].value;
          skills.backend.nodejs = doc.items[1].value;
          skills.backend.mongodb = doc.items[2].value;
          res.setHeader('Content-Type', 'text/html; charset=utf8');
          res.render('about', skills);
        }
      });
    });
  });
});

app.post('/mail', function(req,res) {
  console.log(req.body);
  var transporter = nodemailer.createTransport(config.mail.smtp);
  var mailOptions = {
      from: `"${req.body.name}" <${req.body.email}>`,
      to: config.mail.smtp.auth.user,
      subject: config.mail.subject,
      text: req.body.text.trim().slice(0, 500)
  };
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      res.json({});
  });
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
app.post('/skills', function(req,res) {
  var data = req.body;
  var counter = 0;
  var counterValid = 0;
  console.log(data);
  for (var item in data) {
    var buf = data[item];
    for (var val in buf) {
      console.log(buf[val]);
      counter++;
      if ((+buf[val]>=0)&&(+buf[val]<=100)) {
        counterValid++;
      }
    }
  }
  if (counter===counterValid) {
    var valid = {
      "isValid": true
    };
    valid = JSON.stringify(valid);
    res.setHeader('Content-Type', 'application/json; charset=utf8;');
    res.end(valid);
    var frontend = {
      section: "frontend",
      items: [
        {
          name: "html",
          value: +data.frontend.html
        },
        {
          name: "css",
          value: +data.frontend.css
        },
        {
          name: "js",
          value: +data.frontend.js
        }
        ]
    };
    var workflow = {
      section: "workflow",
      items: [
        {
          name: "git",
          value: +data.workflow.git
        },
        {
          name: "gulp",
          value: +data.workflow.gulp
        },
        {
          name: "bower",
          value: +data.workflow.bower
        }
      ]
    };
    var backend = {
      section: "backend",
      items: [
        {
          name: "php",
          value: +data.backend.php
        },
        {
          name: "nodejs",
          value: +data.backend.nodejs
        },
        {
          name: "mongodb",
          value: +data.backend.mongodb
        }
      ]
    };
    Skill.findOne({ section: "frontend" }, function (err, doc){
      if (!doc) {
        var doc = new Skill(frontend);
      } else {
        doc.items = frontend.items;
      }
      doc.save();
    });
    Skill.findOne({ section: "workflow" }, function (err, doc){
      if (!doc) {
        var doc = new Skill(workflow);
      } else {
        doc.items = workflow.items;
      }
      doc.save();
    });
    Skill.findOne({ section: "backend" }, function (err, doc){
      if (!doc) {
        var doc = new Skill(backend);
      } else {
        doc.items = backend.items;
      }
      doc.save();
    });
  } else {
    var valid = {
      "isValid": false
    };
    valid = JSON.stringify(valid);
    res.setHeader('Content-Type', 'application/json; charset=utf8;');
    res.end(valid);
  }
  
});

app.post('/blog', function(req,res) {
  var data = req.body;
  var post = new Post(data);
  var datePattern = /(0[1-9]|1[0-9]|2[0-9]|3[01]).(0[1-9]|1[012]).[0-9]{4}/;
  if(datePattern.test(data.date)) {
    var valid = {
      "isValid": true
    };
    valid = JSON.stringify(valid);
    res.setHeader('Content-Type', 'application/json; charset=utf8;');
    res.end(valid);
    post.save();
  } else {
    var valid = {
      "isValid": false
    };
    valid = JSON.stringify(valid);
    res.setHeader('Content-Type', 'application/json; charset=utf8;');
    res.end(valid);
  }
});

app.post('/work', function(req,res) {
  var form = new multiparty.Form();
  var count = 1;
  Work.count({}, function(err, num) {
    if(err) {
    } else {
      count = num+1;
    }
    form.parse(req, function(err, fields, files) {
      var item = new Work({
        name: fields.workTitle,
        tech: fields.workTech,
        link: fields.workLink,
        picture: 'upload/work'+count+path.parse(files.workFile[0].path).ext
      });
      var newFilePath = './site/'+item.picture;
      try {
        fs.writeFileSync(path.resolve(newFilePath),fs.readFileSync(files.workFile[0].path));
      } catch (err) {
        console.log("файл не загрузился");
      }
      
      if(fs.existsSync(path.resolve(newFilePath))) {
        var valid = {
          "isValid": true
        };
        item.save();
        valid = JSON.stringify(valid);
        res.setHeader('Content-Type', 'application/json; charset=utf8;');
        res.end(valid);
      } else {
        var valid = {
          "isValid": false
        };
        valid = JSON.stringify(valid);
        res.setHeader('Content-Type', 'application/json; charset=utf8;');
        res.end(valid);
      }
      console.log(item);
    });
  });
  

});
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