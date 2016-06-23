const path = require('path');
const express = require('express');
const logger = require('winston');
const bodyParser = require('body-parser');
const httpHelper = require('sharemyscreen-http-helper');

var loginApp = null;
var loginRouter = null;

function getApp () {
  logger.info('Initializing login app ...');
  loginApp = express();
  loginApp.use(bodyParser.json());

  loginRouter = express.Router();
  
  //Register all routes

  loginApp.use('/v1',loginRouter);
  loginApp.use('/doc', express.static(path.join(__dirname, '/doc'), {dotfiles: 'allow'}));

  //Error handler
  loginApp.use(function (err, req, res, next) {
    logger.error(err);
    httpHelper.sendReply(res, httpHelper.error.internalServerError(err));
  });

  logger.info('Login app initialized');

  return loginApp;
}

module.exports.getApp = getApp;