const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const common = require('sharemyscreen-common');
const fixture = require('../fixture/oauth2.json');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const loginSrv = supertest(url);

describe('Testing OAuth2 password grant (POST /v1/oauth2/token)', function (done) {
  before(function (done) {
    common.clientModel.createFix(fixture.client.name,
      fixture.client.key,
      fixture.client.secret,
      function (err) {
        if (err) {
          done(err);
        } else {
          common.userModel.createPassword(fixture.user.email,
            fixture.user.password,
            fixture.user.first_name,
            fixture.user.last_name,
            function (err) {
              if (err) {
                done(err);
              } else {
                done();
              }
            });
        }
      });
  });

  it('Should return an access and refresh token', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'password', 'username': fixture.user.email, 'password': fixture.user.password })
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

  it('Should reply an error when wrong error credential', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'password', 'username': fixture.user.email, 'password': 'false' })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(403)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.error).to.equal('invalid_grant');
          expect(res.body.error_description).to.equal('Invalid resource owner credentials');
          done();
        }
      });
  });

  it('Should reply an error when missing credential', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'password', 'username': fixture.user.email })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(400)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.error).to.equal('invalid_request');
          expect(res.body.error_description).to.equal('Missing required parameter: password');
          done();
        }
      });
  });

  it('Should reply an error when using another grant type', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'code', 'username': fixture.user.email })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(501)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.error).to.equal('unsupported_grant_type');
          expect(res.body.error_description).to.equal('Unsupported grant type: code');
          done();
        }
      });
  });

  it('Should reply an error when request is not authenticated', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'code', 'username': fixture.user.email })
      .set('Content-Type', 'application/json')
      .expect(401)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.equal('Unauthorized');
          done();
        }
      });
  });

  it('Should reply an error when bad request authentication', function (done) {
    loginSrv
      .post('/v1/oauth2/token')
      .send({ 'grant_type': 'code', 'username': fixture.user.email })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, 'false')
      .expect(401)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.text).to.equal('Unauthorized');
          done();
        }
      });

  });
});
