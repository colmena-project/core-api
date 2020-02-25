const SendGrid = require('@sendgrid/mail');

let SimpleSendGridAdapter = mailOptions => {
  if (!mailOptions || !mailOptions.apiKey || !mailOptions.fromAddress) {
    throw 'SimpleSendGridAdapter requires an API Key.';
  }
  
  let sendgrid = new SendGrid.MailService()

  let sendMail = ({to, subject, text, html, templateId, dynamic_template_data }) => {

    sendgrid.setApiKey(mailOptions.apiKey);
    let msg = {
      to: to,
      from: mailOptions.fromAddress,
      subject: subject,
      text: text,
      html: html || `<div>${text}</div>`,
    };

    if (templateId && dynamic_template_data ){
      msg = { ...msg, templateId, dynamic_template_data }
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
  }

  return Object.freeze({
      sendMail: sendMail
  });
}

module.exports = SimpleSendGridAdapter