const config = require('config');
const prompt = require('prompt');
const expect = require('chai').expect;
const supertest = require('supertest');
const common = require('sharemyscreen-common');
const fixture = require('../../fixture/oauth2/google-connect.json');

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const loginSrv = supertest(url);

var googleToken;

describe('Testing Google-connect (POST /v1/oauth2/google-connect)', function () {
  before(function (done) {
    this.timeout(0);
    common.clientModel.createFix(fixture.client.name,
      fixture.client.key,
      fixture.client.secret,
      function (err) {
        if (err) {
          done(err);
        } else {
          prompt.start();
          prompt.get('GoogleAccessToken', function (err, result) {
            if (err) {
              done(err);
            } else {
              googleToken = result.GoogleAccessToken;
              done();
            }
          });
        }
      });
  });

  it('Should create a new user and reply access and refresh tokens', function (done) {
    loginSrv
      .post('/v1/oauth2/google-connect')
      .send({ 'access_token': googleToken })
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
          expect(res.body.creation).to.be.true;
          expect(res.body.token_type).to.equal('Bearer');
          done();
        }
      });
  });

  it('Should not create a new user and reply access and refresh tokens', function (done) {
    loginSrv
      .post('/v1/oauth2/google-connect')
      .send({ 'access_token': googleToken })
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

  it('Should reply an error when wrong google access_token', function (done) {
    loginSrv
      .post('/v1/oauth2/google-connect')
      .send({ 'access_token': 'AccessToken' })
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(400)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.code).to.equal(2);
          expect(res.body.sub_code).to.equal(1);
          expect(res.body.message).to.equal('Invalid google token');
          done();
        }
      });
  });
});
