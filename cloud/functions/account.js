/* eslint-disable no-unused-vars */
const { Parse } = global;
const { getMailAdapter } = require('../utils/core');

const findUserAccount = async (user) => {
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  return account;
};

const createAccount = async (request) => {
  const { params, user } = request;
  const { firstName, middleName, lastName, nickname, facebook, facebookProfilePhotoUrl } = params;
  let account = await findUserAccount(user);
  if (!account) {
    const Account = Parse.Object.extend('Account');
    const newAccount = new Account();
    newAccount.set('firstName', firstName);
    newAccount.set('middleName', middleName);
    newAccount.set('lastName', lastName);
    newAccount.set('nickname', nickname);
    newAccount.set('facebook', facebook);
    newAccount.set('facebookProfilePhotoUrl', facebookProfilePhotoUrl);
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
      account = newAccount;
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
