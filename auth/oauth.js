const oauth2orize = require('oauth2orize');
const common = require('sharemyscreen-common');

var server = oauth2orize.createServer();

server.exchange(oauth2orize.exchange.password(function (client, email, password, scopes, done) {
  if (client.trusted === false) {
    done(null, false);
  } else {
    common.userModel.getByCredential(email, password, function (err, fUser) {
      if (err) {
        done(err);
      } else if (fUser === false) {
        done(null, false);
      } else {
        common.accessTokenModel.createNew(client, fUser, function (err, cToken) {
          if (err) {
            done(err);
          } else {
            common.refreshTokenModel.createNew(client, fUser, function (err, cRToken) {
              if (err) {
                done(err);
              } else {
                return done(null, cToken.token, cRToken.token, { expires_in: cToken.duration, creation: false });
              }
            });
          }
        });
      }
    });
  }
}));

server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
  common.refreshTokenModel.getByClientToken(client, refreshToken, function (err, fRefreshToken) {
    if (err) {
      done(err);
    } else if (fRefreshToken === null) {
      done(null, false);
    } else {
      common.accessTokenModel.createNew(client, fRefreshToken.user, function (err, cAccessToken) {
        if (err) {
          done(err);
        } else {
          common.refreshTokenModel.createNew(client, fRefreshToken.user, function (err, cRefreshToken) {
            if (err) {
              done(err);
            } else {
              fRefreshToken.revoke(function (err) {
                if (err) {
                  done(err);
                } else {
                  return done(null, cAccessToken.token, cRefreshToken.token, { expires_in: cAccessToken.duration, creation: false });
                }
              });
            }
          });
        }
      });
    }
  });
}));

module.exports.token = [server.token(), server.errorHandler()];
