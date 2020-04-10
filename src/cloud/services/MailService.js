/* @flow  */
const { Parse } = global;
const { getMailAdapter } = require('../utils/core');

const sendNewAccountCreated = async (params: {
  name: string,
  username: string,
  to: string,
  subject: string,
}): Promise<any> => {
  const { name, username, to, subject } = params;
  try {
    return getMailAdapter().sendMail({
      to,
      subject,
      templateId: 'd-496bcadd14964012b70b8be0eaf9f8c2',
      dynamic_template_data: {
        name,
        username,
      },
    });
  } catch (error) {
    throw new Parse.Error(500, `Cannot send mail to ${to}.`);
  }
};

module.exports = {
  sendNewAccountCreated,
};
