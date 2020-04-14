const grantReadAndWritePermissionsToUser = async (
  className: string,
  objectId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  const query: Parse.Query = new Parse.Query(className);
  const object: Parse.Object = await query.get(objectId, { useMasterKey: true });
  const acl: Parse.ACL | undefined = object.getACL();
  if (acl) {
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    object.setACL(acl);
    await object.save(null, { useMasterKey: true });
  }
  return object;
};

const revokeReadAndWritePermissionsToUser = async (
  className: string,
  objectId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  const query: Parse.Query = new Parse.Query(className);
  const object = await query.get(objectId, { useMasterKey: true });
  const acl = object.getACL();
  if (acl) {
    acl.setReadAccess(user.id, false);
    acl.setWriteAccess(user.id, false);
    object.setACL(acl);
    await object.save(null, { useMasterKey: true });
  }
  return object;
};

export default {
  grantReadAndWritePermissionsToUser,
  revokeReadAndWritePermissionsToUser,
};
