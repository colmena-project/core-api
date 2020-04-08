const { Parse } = global;

const grantReadAndWritePermissionsToUser = async (className, objectId, user) => {
  const query = new Parse.Query(className);
  const object = await query.get(objectId, { useMasterKey: true });
  const acl = object.getACL();
  acl.setReadAccess(user.id, true);
  acl.setWriteAccess(user.id, true);
  object.setACL(acl);
  await object.save(null, { useMasterKey: true });
  return object;
};

const revokeReadAndWritePermissionsToUser = async (className, objectId, user) => {
  const query = new Parse.Query(className);
  const object = await query.get(objectId, { useMasterKey: true });
  const acl = object.getACL();
  acl.setReadAccess(user.id, false);
  acl.setWriteAccess(user.id, false);
  object.setACL(acl);
  await object.save(null, { useMasterKey: true });
  return object;
};

module.exports = {
  grantReadAndWritePermissionsToUser,
  revokeReadAndWritePermissionsToUser,
};
