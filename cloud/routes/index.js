const defaultRoutes = require('./default');
const account = require('./account');
const maps = require('./maps');
const transaction = require('./transaction');
const workflow = require('./workflow');

module.exports = {
  default: defaultRoutes,
  account,
  maps,
  transaction,
  workflow,
};
