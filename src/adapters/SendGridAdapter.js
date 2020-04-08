const SendGrid = require('@sendgrid/mail');

const SimpleSendGridAdapter = (mailOptions) => {
  if (!mailOptions || !mailOptions.apiKey || !mailOptions.fromAddress) {
    throw new Error('SimpleSendGridAdapter requires an API Key.');
  }

  const sendgrid = new SendGrid.MailService();

  const sendMail = ({ to, subject, text, html, templateId, dynamic_template_data }) => {
    sendgrid.setApiKey(mailOptions.apiKey);
    let msg = {
      to,
      from: mailOptions.fromAddress,
      subject,
      text,
      html: html || `<div>${text}</div>`,
    };

    if (templateId && dynamic_template_data) {
      msg = { ...msg, templateId, dynamic_template_data };
    }

    return sendgrid.send(msg);

    // return new Promise((resolve, reject) => {
    //   sendgrid.send({
    //     from: mailOptions.fromAddress,
    //     to: to,
    //     subject: subject,
    //     text: text,
    //   }, function(err, json) {
    //     if (err) {
    //        reject(err);
    //     }
    //     resolve(json);
    //   });
    // });
  };

  return Object.freeze({
    sendMail,
  });
};

module.exports = SimpleSendGridAdapter;
