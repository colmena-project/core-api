const { Parse } = global;
const Container = require('../classes/Container');
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const createContainer = async (type, status, user) => {
  const authOptions = getQueryAuthOptions(user);
  const number = await getValueForNextSequence(Container.name);
  const container = new Container();
  container.set('status', status);
  container.set('number', number);
  container.set('type', type);
  await container.save(null, authOptions);
  return container;
};

const findContainerById = async (id, user, master) => {
  const authOptions = getQueryAuthOptions(user, master);
  const query = new Parse.Query('Container');
  query.include('type');
  const container = await query.get(id, authOptions);
  return container;
};

const createContainersOfType = async (type, number, status, user) => {
  const promises = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < number; i++) {
    promises.push(createContainer(type, status, user));
  }
  const containers = await Promise.all(promises);
  return containers;
};

const updateContainerStatus = async (container, status, user) => {
  const authOptions = getQueryAuthOptions(user);
  container.set('status', status);
  await container.save(null, authOptions);
  return container;
};

module.exports = {
  createContainer,
  findContainerById,
  createContainersOfType,
  updateContainerStatus,
};
