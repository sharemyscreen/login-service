const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const common = require('sharemyscreen-common');
const fixture = require('../../fixture/oauth2/refresh-token.json');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const loginSrv = supertest(url);

describe('Testing OAuth2 refresh_token grant (POST /v1/oauth2/token)', function () {
  before(function (done) {
    common.clientModel.createFix(fixture.client.name,
      fixture.client.key,
      fixture.client.secret,
      function (err, cClient) {
        if (err) {
          done(err);
        } else {
          common.userModel.createPassword(fixture.user.email,
            fixture.user.password,
            fixture.user.first_name,
            fixture.user.last_name,
            function (err, cUser) {
              if (err) {
                done(err);
              } else {
                common.refreshTokenModel.createFix(cClient, cUser, fixture.token, function (err, cRefreshToken) {
                  if (err) {
                    done(err);
                  } else {
                    done();
                  }
                });
              }
            });
        }
      });
  });

  it('Should reply a new AccessToken and RefreshToken', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'refresh_token', 'refresh_token': fixture.token })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.access_token).to.not.be.undefined;
          expect(res.body.refresh_token).to.not.be.undefined;
          expect(res.body.expires_in).to.equal(3600);
          expect(res.body.creation).to.be.false;
          expect(res.body.token_type).to.equal('Bearer');
          done();
        }
      });
  });

  it('Should reply an error when trying to refresh with a revoked refreshToken', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'refresh_token', 'refresh_token': fixture.token })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(403)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.error).to.equal('invalid_grant');
          expect(res.body.error_description).to.equal('Invalid refresh token');
          done();
        }
      });
  });
});
