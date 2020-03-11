const { Parse } = global;

/**
 * Decorator function to apply to all functions that needs to check for user authentication
 * @param {*} callback
 */
function secure(callback) {
  return (request) => {
    const { master: isMaster, user } = request;
    if (!isMaster && !user) {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'User needs to be authenticated');
    }
    return callback.call(this, request);
  };
}

const nullParser = (opt) => {
  if (opt === 'null') {
    return null;
  }
  return opt;
};

const getQueryAuthOptions = (user, master = false) => {
  const options = master ? { useMasterKey: true } : { sessionToken: user.getSessionToken() };
  return options;
};

module.exports = {
  secure,
  nullParser,
  getQueryAuthOptions,
};
