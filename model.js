var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

//Сама схема
//Пользователи
var UserSchema = new Schema({
  login: String,
  password: {
    type: String,
    set(v) {
      return crypto.createHash('md5').update(v).digest('hex');
    }
  },
  apps: [
    Schema.Types.ObjectId
  ]
});

//Приложения
var AppSchema = new Schema({
  name: String,
  access: {
    domen: String,
    token: String
  },
  colors: {
    primary: String,
    secondary: String
  },
  config: {
    baseUrl: String,
    cache: Boolean,
    domCache: Boolean,
    material: Boolean,
    pushState: Boolean,
    swipePanel: String,
    hideNavbarOnPageScroll: Boolean,
    showBarsOnPageScrollEnd: Boolean,
    showBarsOnPageScrollTop: Boolean
  }
});

//Модель
exports.user = mongoose.model('user', UserSchema);
exports.app = mongoose.model('app', AppSchema);