const { Parse } = global;
const MailService = require('./MailService');

const findAccountByUser = async (user) => {
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  return account;
};

const createAccount = async (params, user) => {
  const {
    firstName,
    middleName,
    lastName,
    nickname,
    facebook,
    facebookProfilePhotoUrl,
    aboutMe,
  } = params;
  let account = await findAccountByUser(user);
  if (!account) {
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
    await newAccount.save(null, { sessionToken: user.getSessionToken() });
    const mailParams = {
      name: `${newAccount.get('firstName')} ${newAccount.get('lastName')}`,
      username: user.get('username'),
      to: user.get('email'),
      subject: 'New Colmena Account created',
    };
    await MailService.sendNewAccountCreated(mailParams);
    account = newAccount;
  }

  return {
    account,
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
