/* @flow */

const { Parse } = global;
const { getMailAdapter } = require('../utils/core');

const ping = () => ({
  msg: 'pong',
  time: new Date(),
});

const testMail = async (request: Object): Promise<Object> => {
  const { master } = request;
  if (!master) throw new Parse.Error(403, 'You cannot call this cloud function');
  const { to, subject, text } = request.params;
  if (!(to && subject && text)) {
    throw new Parse.Error(404, 'Invalid Request. See if to, subject and text params are setted.');
  }

  // let providerResponse = null;
  try {
    await getMailAdapter().sendMail({
      to,
      subject,
      text,
    });
  } catch (error) {
    // console.error(error);
    throw new Parse.Error(500, 'Cannot send mail to santiagosemhan@gmail.com');
  }
  return { msg: `Test mail was sent ok. To: ${to}` };
};

module.exports = {
  ping,
  testMail,
};
