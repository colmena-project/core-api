import Parse from '../parse';

const Config = require('parse-server/lib/Config');

function getDatabaseInstance() {
  const config = Config.get(Parse.applicationId);
  const { database } = config.database.adapter;
  return database;
}

function getMailAdapter() {
  return Config.get(Parse.applicationId).emailAdapter;
}

export {
  getDatabaseInstance,
  getMailAdapter,
};
