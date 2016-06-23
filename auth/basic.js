const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const clientModel = require('sharemyscreen-common').clientModel;

function init () {
  passport.use(new BasicStrategy(
    function (key, secret, done) {
      clientModel.getByCredential(key, secret, done);
    }
  ));
}

module.exports.init = init;
