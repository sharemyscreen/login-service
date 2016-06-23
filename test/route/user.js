const config = require('config');
const expect = require('chai').expect;
const supertest = require('supertest');
const fixture = require('../fixture/user.json');
const clientModel = require('sharemyscreen-common').clientModel;

const url = config.get('test.server.url') + ':' + config.get('test.server.port');
const loginSrv = supertest(url);

describe('Testing user creation (POST /v1/user)', function () {
  before(function (done) {
    clientModel.createFix(fixture.client.name, fixture.client.key, fixture.client.secret, function (err, cClient) {
      if (err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('Should create a new user', function (done) {
    loginSrv
      .post('/v1/user')
      .send(fixture.user1)
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(201)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.public_id).to.not.be.undefined;
          expect(res.body.email).to.equal(fixture.user1.email);
          expect(res.body.first_name).to.equal(fixture.user1.first_name);
          expect(res.body.last_name).to.equal(fixture.user1.last_name);
          expect(res.body.password).to.be.undefined;
          done();
        }
      });
  });

  it('Should reply error when incomplete body', function (done) {
    loginSrv
      .post('/v1/user')
      .send(fixture.user2)
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(400)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.code).to.equal(1);
          expect(res.body.message).to.equal('Invalid request');
          done();
        }
      });
  });

  it('Should return an error when not authenticated', function (done) {
    loginSrv
      .post('/v1/user')
      .send(fixture.user1)
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

  it('Should return an error when bad credential', function (done) {
    loginSrv
      .post('/v1/user')
      .send(fixture.user1)
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key + 'i', fixture.client.secret)
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

  it('Should return an error when same email', function (done) {
    loginSrv
      .post('/v1/user')
      .send(fixture.user1)
      .set('Content-Type', 'application/json')
      .auth(fixture.client.key, fixture.client.secret)
      .expect(403)
      .end(function (err, res) {
        if (err) {
          done(err);
        } else {
          expect(res.body.code).to.equal(2);
          expect(res.body.sub_code).to.equal(1);
          expect(res.body.message).to.equal('User exists (email address already in use)');
          done();
        }
      });
  });
});
