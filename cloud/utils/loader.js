const { Parse } = global;
const { secure } = require('./index');
const routes = require('../routes');
const classes = require('../classes');

function loadClassHooks() {
  // Register Classes to load hooks
  const classesArray = Object.keys(classes).map((key) => classes[key]);

  classesArray.forEach((c) => {
    Parse.Cloud.beforeSave(c.name, c.beforeSave);
    Parse.Cloud.afterSave(c.name, c.afterSave);
    Parse.Cloud.beforeDelete(c.name, c.beforeDelete);
    Parse.Cloud.afterDelete(c.name, c.afterDelete);
    Parse.Cloud.beforeFind(c.name, c.beforeFind);
    Parse.Cloud.beforeFind(c.name, c.beforeFind);
    Parse.Cloud.afterFind(c.name, c.afterFind);
    Parse.Object.registerSubclass(c.name, c);
  });
}

function loadCloudFunctions(legacy = false) {
  const cloudFunctions = new Map();
  Object.keys(routes).forEach((controller) => {
    Object.keys(routes[controller]).forEach((action) => {
      const actionPath = legacy ? action : `${controller}_${action}`;
      if (cloudFunctions.has(actionPath)) {
        throw new Error(
          `${actionPath} was already defined. Please check your routes definitions in your route directory.`,
        );
      }
      cloudFunctions.set(actionPath, routes[controller][action]);
    });
  });

  cloudFunctions.forEach((cloudFnDefinition, path) => {
    const { action, secure: isSecure } = cloudFnDefinition;
    if (isSecure) {
      Parse.Cloud.define(path, secure(action));
    } else {
      Parse.Cloud.define(path, action);
    }
    console.info('Loaded ', path);
  });
}

module.exports = {
  loadClassHooks,
  loadCloudFunctions,
};
