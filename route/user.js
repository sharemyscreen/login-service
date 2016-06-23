const passport = require('passport');
const httpHelper = require('sharemyscreen-http-helper');
const userModel = require('sharemyscreen-common').userModel;

function registerRoute (router) {
  router.post('/user', passport.authenticate('basic', { session: false }), createUser);
}

function createUser (req, res, next) {
  if (req.body.email === undefined || req.body.password === undefined ||
    req.body.first_name === undefined || req.body.last_name === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidRequestError());
  } else {
    userModel.getByEmail(req.body.email, function (err, fUser) {
      if (err) {
        next(err);
      } else if (fUser != null) {
        httpHelper.sendReply(res, httpHelper.error.userExist());
      } else {
        userModel.createPassword(req.body.email,
          req.body.password,
          req.body.first_name,
          req.body.last_name,
          function (err, cUser) {
            if (err) {
              next(err);
            } else {
              httpHelper.sendReply(res, 201, cUser.safePrint());
            }
          });
      }
    });
  }
}

module.exports.registerRoute = registerRoute;
