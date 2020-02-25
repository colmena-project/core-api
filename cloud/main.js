const { Parse } = global;
const { registerClasses, loadTriggers } = require('./utils/core');
const { common, maps, account } = require('./functions');

Parse.Cloud.beforeLogin(async (request) => {
  const { object: user } = request;
  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});

registerClasses();

// Load triggers for each registered class
loadTriggers();

// Common Cloud Functions
Parse.Cloud.define('ping', common.ping);
Parse.Cloud.define('testMail', common.testMail);
Parse.Cloud.define('distanceCalculate', maps.distanceCalculate);
Parse.Cloud.define('registerSimpleAccount', account.registerSimpleAccount);
Parse.Cloud.define('getMyAccount', account.getMyAccount);

// Parse.Cloud.Run('registerSimpleAccount', { params: {} });
