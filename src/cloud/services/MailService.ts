import { getMailAdapter } from '../utils/core';

const sendNewAccountCreated = async (params: {
  name: string;
  username: string;
  to: string;
  subject: string;
}): Promise<any> => {
  const { name, username, to, subject } = params;
  try {
    return getMailAdapter().sendMail({
      to,
      subject,
      templateId: 'd-370b10218f5c4cd58a74c4bee3b44c28',
      dynamicTemplateData: {
        name,
        username,
      },
    });
  } catch (error) {
    throw new Error(`Cannot send mail to ${to}.`);
  }
};

export default {
  sendNewAccountCreated,
};
