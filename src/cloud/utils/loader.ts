import { Colmena } from '../../types/index';
import { secure } from '../utils/index';
import * as routes from '../routes';
import * as classes from '../classes';

// @ts-ignore
const ParseServer = global.Parse;

function loadClassHooks(): void {
  // Register Classes to load hooks
  // @ts-ignore
  const classesArray = Object.keys(classes).map((key) => classes[key]);

  classesArray.forEach((c) => {
    ParseServer.Cloud.beforeSave(c.name, c.beforeSave);
    ParseServer.Cloud.afterSave(c.name, c.afterSave);
    ParseServer.Cloud.beforeDelete(c.name, c.beforeDelete);
    ParseServer.Cloud.afterDelete(c.name, c.afterDelete);
    ParseServer.Cloud.beforeFind(c.name, c.beforeFind);
    ParseServer.Cloud.beforeFind(c.name, c.beforeFind);
    ParseServer.Cloud.afterFind(c.name, c.afterFind);
    Parse.Object.registerSubclass(c.name, c);
  });
}

function loadCloudFunctions(legacy: boolean = false) {
  const cloudFunctions: Map<string, Colmena.RouteDefinition> = new Map();
  Object.keys(routes).forEach((controller: string) => {
    // @ts-ignore
    Object.keys(routes[controller]).forEach((action: string) => {
      const actionPath: string = legacy ? action : `${controller}_${action}`;
      if (cloudFunctions.has(actionPath)) {
        throw new Error(
          `${actionPath} was already defined. Please check your routes definitions in your route directory.`,
        );
      }
      // @ts-ignore
      if (routes[controller][action].action === undefined) {
        throw new Error(
          // eslint-disable-next-line max-len
          `${actionPath} call to undefined function. Please check your routes definitions in your route directory.`,
        );
      }
      // @ts-ignore
      cloudFunctions.set(actionPath, routes[controller][action]);
    });
  });

  cloudFunctions.forEach((cloudFnDefinition: Colmena.RouteDefinition, path: string): void => {
    const { action, secure: isSecure } = cloudFnDefinition;
    if (isSecure) {
      ParseServer.Cloud.define(path, secure(action));
    } else {
      ParseServer.Cloud.define(path, action);
    }
    console.info('Loaded ', path);
  });
}

export {
  loadClassHooks,
  loadCloudFunctions,
};
