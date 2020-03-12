/* eslint-disable no-underscore-dangle */
const { Parse } = global;
const MailService = require('./MailService');

const findAccountByUser = async (user) => {
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  return account;
};

const createAccount = async (params) => {
  const {
    username,
    email,
    password,
    firstName,
    middleName,
    lastName,
    nickname,
    facebook,
    facebookProfilePhotoUrl,
    aboutMe,
    fbAuthData,
  } = params;
  const user = new Parse.User();
  user.set('username', username);
  user.set('password', password);
  user.set('email', email);
  await user.signUp();
  if (fbAuthData && !user._isLinked('facebook')) {
    await user._linkWith('facebook', { authData: fbAuthData });
  }
  const Account = Parse.Object.extend('Account');
  const newAccount = new Account();
  newAccount.set('firstName', firstName);
  newAccount.set('middleName', middleName);
  newAccount.set('lastName', lastName);
  newAccount.set('nickname', nickname);
  newAccount.set('facebook', facebook);
  newAccount.set('facebookProfilePhotoUrl', facebookProfilePhotoUrl);
  newAccount.set('aboutMe', aboutMe);
  newAccount.set('user', user);
  const accountACL = new Parse.ACL();
  accountACL.setPublicReadAccess(true);
  accountACL.setPublicWriteAccess(false);
  accountACL.setReadAccess(user, true);
  accountACL.setWriteAccess(user, true);
  newAccount.setACL(accountACL);

  await newAccount.save();
  const mailParams = {
    name: `${newAccount.get('firstName')} ${newAccount.get('lastName')}`,
    username: user.get('username'),
    to: user.get('email'),
    subject: 'New Colmena Account created',
  };
  await MailService.sendNewAccountCreated(mailParams);

  return {
    account: newAccount,
  };
};

const findAccountById = async (accountId, user) => {
  if (!accountId) throw new Parse.Error(404, 'Account Not Found');
  const accountQuery = new Parse.Query('Account');
  const account = await accountQuery.get(accountId, { sessionToken: user.getSessionToken() });
  // TODO: clean private account data.
  // Resume data to send to client
  return {
    account,
    activityFeed: [],
    rewards: [],
  };
};

module.exports = {
  findAccountByUser,
  createAccount,
  findAccountById,
};
