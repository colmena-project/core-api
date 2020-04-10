/* @flow */
import type { RouteDefinitions } from '../../flow-types';

const { TransactionController } = require('../controllers');

const definitions: RouteDefinitions = {
  findTransactionById: {
    action: TransactionController.findTransactionById,
    secure: true,
  },
};

module.exports = definitions;
