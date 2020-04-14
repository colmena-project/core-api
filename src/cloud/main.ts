import { loadCloudFunctions, loadClassHooks } from './utils/loader';

// Load triggers for each registered class
loadClassHooks();

const legacyMode = true;
loadCloudFunctions(legacyMode);

Parse.Cloud.beforeLogin((request: Parse.Cloud.TriggerRequest) => {
  const { object: user } = request;
  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});
