/* @flow */
import type { RouteDefinitions } from '../../flow-types';

const { AccountController } = require('../controllers');

const definitions: RouteDefinitions = {
  createAccount: {
    action: AccountController.createAccount,
    secure: false,
  },
  getMyAccount: {
    action: AccountController.getMyAccount,
    secure: true,
  },
  getAccountOf: {
    action: AccountController.getAccountOf,
    secure: true,
  },
  addNewAddress: {
    action: AccountController.addNewAddress,
    secure: true,
  },
  editAddress: {
    action: AccountController.editAddress,
    secure: true,
  },
};

module.exports = definitions;
