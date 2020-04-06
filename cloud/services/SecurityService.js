const { Parse } = global;
const ContainerService = require('./ContainerService');

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

const isRecyclerOfContainer = async (container, user) => {
  const transaction = await ContainerService.findRecoverTransactionOfContainer(container);
  return transaction && transaction.get('to').equals(user);
};

const isCarrierOfContainer = async (container, user) => {
  const transaction = await ContainerService.findTransferAcceptTransactionOfContainer(container);
  return transaction && transaction.get('to').equals(user);
};

const canTransportContainer = async (container, user) => {
  const [isRecycler, isCarrier] = await Promise.all([
    isRecyclerOfContainer(container, user),
    isCarrierOfContainer(container, user),
  ]);
  if (!(isRecycler || isCarrier)) {
    throw new Error(
      `Cannot transport container ${container.id}. Please check our security policies.`,
    );
  }
  return true;
};

module.exports = {
  grantReadAndWritePermissionsToUser,
  revokeReadAndWritePermissionsToUser,
  canTransportContainer,
};
