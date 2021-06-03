import { loadCloudFunctions, loadClassHooks } from './utils/loader';

// Load triggers for each registered class
loadClassHooks();

const legacyMode = true;
loadCloudFunctions(legacyMode);

Parse.Cloud.beforeLogin(async (request: Parse.Cloud.TriggerRequest) => {
  const { object: user, headers } = request;

  const domainUUID = headers['X-Requested-With'];

  if (domainUUID) {
    const domain = await new Parse.Query('Domain')
      .include('role')
      .equalTo('uuid', domainUUID)
      .first();
    if (!domain) throw new Error('Invalid domain');
    const role = <Parse.Object>domain.get('role');
    const users = <Parse.Relation>role.get('users');
    const existingUser = await users.query().get(user.id);
    if (!existingUser) throw new Error('User is not allowed to login in domain');
  }

  if (user.get('isBanned')) {
    throw new Error('Access denied, your account is disabled.');
  }
});
