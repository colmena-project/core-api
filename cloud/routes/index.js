const defaultRoutes = require('./default');
const account = require('./account');
const maps = require('./maps');
const transaction = require('./transaction');

module.exports = {
  default: defaultRoutes,
  account,
  maps,
  transaction,
};
