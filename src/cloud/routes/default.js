/* @flow */
import type { RouteDefinitions } from '../../flow-types';

const { DefaultController } = require('../controllers');

const definitions: RouteDefinitions = {
  ping: {
    action: DefaultController.ping,
    secure: false,
  },
  testMail: {
    action: DefaultController.testMail,
    secure: true,
  },
};

module.exports = definitions;
