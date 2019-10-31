const { Parse } = global;

const { common, maps } = require('./functions');

Parse.Cloud.beforeLogin(async (request) => {
  const { object: user } = request;
  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});

// Before Save Triggers

// After Save Triggers

// Before Delete Triggers

// After Delete Triggers


// Before Find Triggers

// After Find Triggers

// Common Cloud Functions
Parse.Cloud.define('ping', common.ping);
Parse.Cloud.define('distanceCalculate', maps.distanceCalculate);
