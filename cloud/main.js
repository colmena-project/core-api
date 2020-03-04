const { Parse } = global;
const { registerClasses, loadTriggers } = require('./utils/core');
const { common, maps, account } = require('./functions');
const { Account } = require('./classes');
const { secure } = require('./utils');

Parse.Cloud.beforeLogin(async (request) => {
  const { object: user } = request;
  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});

registerClasses(Account);

// Load triggers for each registered class
loadTriggers();

// Common Cloud Functions
Parse.Cloud.define('ping', common.ping);
Parse.Cloud.define('testMail', common.testMail);
Parse.Cloud.define('distanceCalculate', maps.distanceCalculate);
Parse.Cloud.define('createAccount', secure(account.createAccount));
Parse.Cloud.define('getMyAccount', secure(account.getMyAccount));

// Parse.Cloud.Run('registerSimpleAccount', { params: {} });
