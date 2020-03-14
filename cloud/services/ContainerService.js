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

module.exports = {
  createContainer,
};
