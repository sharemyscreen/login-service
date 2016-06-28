const path = require('path');
const express = require('express');
const logger = require('winston');
const basicAuth = require('./auth/basic');
const passport = require('passport');
const bodyParser = require('body-parser');
const httpHelper = require('sharemyscreen-http-helper');

const userRoute = require('./route/user');
const oauth2Route = require('./route/oauth2');

var loginApp = null;
var loginRouter = null;

function getApp () {
  logger.info('Initializing login app ...');
  loginApp = express();
  loginApp.use(bodyParser.json());
  loginApp.use(passport.initialize());

  loginRouter = express.Router();

  basicAuth.init();

  loginApp.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
  });

  // Register all routes
  userRoute.registerRoute(loginRouter);
  oauth2Route.registerRoute(loginRouter);

  loginApp.use('/v1', loginRouter);
  loginApp.use('/doc', express.static(path.join(__dirname, '/doc'), {dotfiles: 'allow'}));

  // Error handler
  loginApp.use(function (err, req, res, next) {
    logger.error(err);
    httpHelper.sendReply(res, httpHelper.error.internalServerError(err));
  });

  logger.info('Login app initialized');

  return loginApp;
}

module.exports.getApp = getApp;
