/* @flow */
import type { AuthOptionsType, ParseUser } from '../../flow-types';

const { Parse } = global;

/**
 * Decorator function to apply to all functions that needs to check for user authentication
 * @param {*} callback
 */
function secure(callback: Function): any {
  return (request: Object) => {
    const { master: isMaster, user } = request;
    if (!isMaster && !user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User needs to be authenticated');
    }
    return callback.call(this, request);
  };
}

const nullParser = (opt: ?string): ?string => {
  if (opt === 'null') {
    return null;
  }
  return opt;
};

function replaceInTemplate(template: string, data: Object): string {
  const pattern = /{\s*(\w+?)\s*}/g; // {property}
  return template.replace(pattern, (_, token) => data[token] || '');
}

const getQueryAuthOptions = (user: ParseUser, master: boolean = false): AuthOptionsType => {
  const options = { useMasterKey: master, sessionToken: user ? user.getSessionToken() : undefined };
  return options;
};

module.exports = {
  secure,
  nullParser,
  replaceInTemplate,
  getQueryAuthOptions,
};
