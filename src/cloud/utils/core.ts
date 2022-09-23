const Config = require('parse-server/lib/Config');

function getDatabaseInstance() {
  const config = Config.get(Parse.applicationId);
  const { database } = config.database.adapter;
  return database;
}

function getMailAdapter() {
  return Config.get(Parse.applicationId).emailAdapter;
}

function getConfig() {
  return Config.get(Parse.applicationId);
}

export { getDatabaseInstance, getMailAdapter, getConfig };

