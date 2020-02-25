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
  const { firstName, lastName } = params;
  const Account = Parse.Object.extend('Account');
  const account = new Account();
  account.set('firstName', firstName);
  account.set('lastName', lastName);
  account.set('user', user);
  await account.save();
  try {
    await getMailAdapter().sendMail({
      to: user.get("email"), 
      subject: "New Colmena Account created",
      text: "Usted ha creado una nueva cuenta en Colmena App.",
      templateId: 'd-496bcadd14964012b70b8be0eaf9f8c2',
      dynamic_template_data: {
        subject: "New Colmena Account created",
        name: `${account.get("firstName")} ${account.get("lastName")}`,
        username: user.get("username")
      },
    });
  } catch (error) {
    throw new Parse.Error(500, `Cannot send mail to ${to}`);
  }
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
