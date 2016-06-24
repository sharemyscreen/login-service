const passport = require('passport');
const oauth2 = require('../auth/oauth');

function registerRoute (router) {
  router.post('/oauth2/token', passport.authenticate('basic', { session: false }), oauth2.token);
}

module.exports.registerRoute = registerRoute;
