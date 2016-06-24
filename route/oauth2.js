const config = require('config');
const passport = require('passport');
const oauth2 = require('../auth/oauth');
const common = require('sharemyscreen-common');
const httpHelper = require('sharemyscreen-http-helper');

const google = require('googleapis');
const facebook = require('../service/facebookAPI');

function registerRoute (router) {
  router.post('/oauth2/token', passport.authenticate('basic', { session: false }), oauth2.token);
  router.post('/oauth2/google-connect', passport.authenticate('basic', { session: false }), googleConnect);
  router.post('/oauth2/facebook-connect', passport.authenticate('basic', { session: false }), facebookConnect);
}

function googleConnect (req, res, next) {
  if (req.body.access_token === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidRequestError());
  } else {
    const oauth2Service = google.oauth2({version: 'v2'});

    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2();
    oauth2Client.setCredentials({
      access_token: req.body.access_token
    });

    oauth2Service.userinfo.v2.me.get({ auth: oauth2Client,
        key: config.get('googleApiKey') },
      function (err, userInfo) {
        if (err) {
          httpHelper.sendReply(res, httpHelper.error.invalidGoogleToken());
        } else {
          common.userModel.getByGoogleId(userInfo['id'], function (err, fUser) {
            if (err) {
              next(err);
            } else if (fUser == null) {
              common.userModel.createGoogle(
                userInfo['email'],
                userInfo['id'],
                userInfo['given_name'],
                userInfo['family_name'],
                function (err, cUser) {
                  if (err) {
                    next(err);
                  } else {
                    sendTokens(res, req.user, cUser, true, next);
                  }
                });
            } else {
              sendTokens(res, req.user, fUser, false, next);
            }
          });
        }
      });
  }
}

function facebookConnect (req, res, next) {
  if (req.body.access_token === undefined) {
    httpHelper.sendReply(res, httpHelper.error.invalidRequestError());
  } else {
    facebook.getUserInformation(req.body.access_token, 'me', function (err, fbErr, userInfo) {
      if (err) {
        next(err);
      } else if (fbErr) {
        httpHelper.sendReply(res, fbErr);
      } else {
        common.userModel.getByFacebookId(userInfo.id, function (err, fUser) {
          if (err) {
            next(err);
          } else if (fUser == null) {
            common.userModel.createFacebook(userInfo.email, userInfo.id,
              userInfo.first_name, userInfo.last_name, function (err, cUser) {
                if (err) {
                  next(err);
                } else {
                  sendTokens(res, req.user, cUser, true, next);
                }
              });
          } else {
            sendTokens(res, req.user, fUser, false, next);
          }
        });
      }
    });
  }
}

function sendTokens (res, client, user, newUser, next) {
  common.accessTokenModel.createNew(client, user, function (err, cAccessToken) {
    if (err) {
      next(err);
    } else {
      common.refreshTokenModel.createNew(client, user, function (err, cRefreshToken) {
        if (err) {
          next(err);
        } else {
          httpHelper.sendReply(res, 200, {
            'accessToken': cAccessToken.token,
            'refreshToken': cRefreshToken.token,
            'expiresIn': cAccessToken.duration,
            'tokenType': 'Bearer',
            'creation': newUser
          });
        }
      });
    }
  });
}

module.exports.registerRoute = registerRoute;
