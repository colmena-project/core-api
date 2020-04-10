/* @flow */
import type { MailType } from '../flow-types';

const SendGrid = require('@sendgrid/mail');

const SimpleSendGridAdapter = (mailOptions: { apiKey?: string, fromAddress: string }) => {
  if (!mailOptions || !mailOptions.apiKey || !mailOptions.fromAddress) {
    throw new Error('SimpleSendGridAdapter requires an API Key.');
  }

  const sendgrid = new SendGrid.MailService();

  // eslint-disable-next-line camelcase
  const sendMail = ({ to, subject, text, html, templateId, dynamic_template_data }: MailType): Promise<any> => {
    sendgrid.setApiKey(mailOptions.apiKey);
    let msg = {
      to,
      from: mailOptions.fromAddress,
      subject,
      text,
      html: html || `<div>${text}</div>`,
    };

    // eslint-disable-next-line camelcase
    if (templateId && dynamic_template_data) {
      msg = { ...msg, templateId, dynamic_template_data };
    }

    return sendgrid.send(msg);
  };

  return Object.freeze({
    sendMail,
  });
};

module.exports = SimpleSendGridAdapter;
