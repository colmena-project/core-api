/* eslint-disable no-unused-vars */
const { Parse } = global;
const { getMailAdapter } = require('../utils/core');

const checkUser = async (user) => {
  if (!user) {
    throw new Parse.Error(
      Parse.Error.INVALID_SESSION_TOKEN,
      'Invalid User. The user must login again.',
    );
  }

  return Promise.resolve();
};

const findUserAccount = async (user) => {
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  return account;
};

const createAccount = async (request) => {
  const { params, user } = request;
  await checkUser(user);
  const { firstName, lastName } = params;
  const account = await findUserAccount(user);
  if (!account) {
    const Account = Parse.Object.extend('Account');
    const newAccount = new Account();
    newAccount.set('firstName', firstName);
    newAccount.set('lastName', lastName);
    newAccount.set('user', user);
    await newAccount.save(null, { sessionToken: user.getSessionToken() });
    try {
      await getMailAdapter().sendMail({
        to: user.get('email'),
        subject: 'New Colmena Account created',
        templateId: 'd-496bcadd14964012b70b8be0eaf9f8c2',
        dynamic_template_data: {
          name: `${newAccount.get('firstName')} ${newAccount.get('lastName')}`,
          username: user.get('username'),
        },
      });
      return { account: newAccount };
    } catch (error) {
      throw new Parse.Error(500, `Cannot send mail to ${user.get('email')}`);
    }
  }

  return {
    account,
  };
};

const getMyAccount = async (request) => {
  const { user } = request;
  await checkUser(user);
  const account = await findUserAccount(user);
  return { account };
};

module.exports = {
  createAccount,
  getMyAccount,
};
