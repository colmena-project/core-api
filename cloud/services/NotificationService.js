const { Parse } = global;

const AccountService = require('./AccountService');
const PushService = require('./PushService');
const { NOTIFICATION_TYPES } = require('../constants');
const { replaceInTemplate } = require('../utils');

const notifyTransferRequest = async (transactionId, fromUser, toUser) => {
  if (!transactionId) throw new Error(`Cannot send notification to an empty ${transactionId}`);
  const fromAccount = await AccountService.findAccountByUser(fromUser);
  const toAccount = await AccountService.findAccountByUser(toUser);
  const language = toAccount.get('defaultLanguage');

  const query = new Parse.Query('NotificationTemplate');
  query.equalTo('type', NOTIFICATION_TYPES.TRANSFER_REQUEST);
  query.equalTo('language', language);
  const NotificationTemplate = await query.first({ useMasterKey: true });

  if (!NotificationTemplate) {
    throw new Error(
      `Cannot found any template for type: ${NOTIFICATION_TYPES.TRANSFER_REQUEST} and language: ${language}`,
    );
  }
  const template = NotificationTemplate.get('template');

  const message = replaceInTemplate(template, {
    from: fromAccount.get('nickname'),
    to: toAccount.get('nickname'),
  });

  return PushService.sendPushNotificationToUser(
    NOTIFICATION_TYPES.TRANSFER_REQUEST,
    message,
    {
      transactionId,
    },
    toUser,
  );
};

module.exports = {
  notifyTransferRequest,
};
