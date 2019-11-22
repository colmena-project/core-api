/* eslint-disable no-unused-vars */
const { Parse } = global;

const checkUser = async (user) => {
  if (!user) {
    throw new Parse.Error(
      Parse.Error.INVALID_SESSION_TOKEN,
      'Invalid User. The user must login again.',
    );
  }

  return Promise.resolve();
};

const registerSimpleAccount = async (request) => {
  const { params, user } = request;
  await checkUser(user);
  const Account = Parse.Object.extend('Account');
  const account = new Account();
  account.set('user', user);
  await account.save();

  return {
    account,
  };
};

const getMyAccount = async (request) => {
  const { user } = request;
  await checkUser(user);
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  return { account };
};

module.exports = {
  registerSimpleAccount,
  getMyAccount,
};
