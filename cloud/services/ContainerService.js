const { Parse } = global;
const Container = require('../classes/Container');
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const findContainerById = async (id, user, master) => {
  try {
    const authOptions = getQueryAuthOptions(user, master);
    const query = new Parse.Query('Container');
    query.include('type');
    const container = await query.get(id, authOptions);
    return container;
  } catch (error) {
    throw new Error(`Container ${id} not found`);
  }
};

// eslint-disable-next-line arrow-body-style
const generateContainerCode = (typeCode, transactionNumber, containerNumber) => {
  return `${typeCode}-${transactionNumber}-${containerNumber}`;
};

const createContainer = async (type, status, transactionNumber, user) => {
  const authOptions = getQueryAuthOptions(user);
  const number = await getValueForNextSequence(Container.name);
  const code = generateContainerCode(type.get('code'), transactionNumber, number);
  const container = new Container();
  container.set('status', status);
  container.set('number', number);
  container.set('type', type);
  container.set('code', code);

  await container.save(null, authOptions);
  return container;
};

const createContainersOfType = async (type, qty, status, transactionNumber, user) => {
  const promises = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qty; i++) {
    promises.push(createContainer(type, status, transactionNumber, user));
  }
  const containers = await Promise.all(promises);
  return containers;
};

const findContainersByTransaction = async (transaction) => {
  const query = new Parse.Query('TransactionDetail');
  query.select('container');
  query.include('container.type');
  query.equalTo('transaction', transaction);
  const transactionsDetails = await query.find({ useMasterKey: true });
  return transactionsDetails.map((detail) => detail.get('container'));
};

module.exports = {
  createContainer,
  findContainerById,
  findContainersByTransaction,
  createContainersOfType,
};
