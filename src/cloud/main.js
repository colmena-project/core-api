/* @flow */
const { Parse } = global;
const { loadCloudFunctions, loadClassHooks } = require('./utils/loader');

// Load triggers for each registered class
loadClassHooks();

const legacyMode = true;
loadCloudFunctions(legacyMode);

Parse.Cloud.beforeLogin(async (request) => {
  const { object: user } = request;
  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});
