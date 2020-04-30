/**
 * Decorator function to apply to all functions that needs to check for user authentication
 * @param {*} callback
 */
function secure(callback: Colmena.CloudFunction): any {
  return (request: Parse.Cloud.FunctionRequest) => {
    const { master: isMaster, user } = request;
    if (!isMaster && !user) {
      const err: Parse.Error = new Parse.Error(
        Parse.Error.INVALID_SESSION_TOKEN,
        'User needs to be authenticated',
      );
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw err;
    }
    // @ts-ignore
    return callback.call(this, request);
  };
}

const nullParser = (opt?: string): string | undefined => {
  if (opt === 'null') {
    return undefined;
  }
  return opt;
};

function replaceInTemplate(template: string, data: { [key: string]: string }): string {
  const pattern = /{\s*(\w+?)\s*}/g; // {property}
  return template.replace(pattern, (_, token) => data[token] || '');
}

const getQueryAuthOptions = (
  user: Parse.User | undefined = undefined,
  master: boolean = false,
): Parse.ScopeOptions => {
  let options: Parse.ScopeOptions = { useMasterKey: master };
  if (master) return options;
  if (user) {
    options = { ...options, sessionToken: user.getSessionToken() };
  }
  return options;
};

export { secure, nullParser, replaceInTemplate, getQueryAuthOptions };
