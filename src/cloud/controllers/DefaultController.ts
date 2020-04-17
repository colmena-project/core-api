import Parse from 'parse/node';
import * as os from 'os';
import { getMailAdapter } from '../utils/core';

const ping = () => ({
  msg: 'pong',
  time: new Date(),
  hostname: os.hostname(),
});

const testMail = async (request: Parse.Cloud.FunctionRequest): Promise<Object> => {
  const { master, params } = request;
  if (!master) throw new Error('You cannot call this cloud function');
  const { to, subject, text } = params;
  if (!(to && subject && text)) {
    throw new Error('Invalid Request. See if to, subject and text params are setted.');
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
    throw new Error('Cannot send mail to santiagosemhan@gmail.com');
  }
  return { msg: `Test mail was sent ok. To: ${to}` };
};

export default {
  ping,
  testMail,
};
