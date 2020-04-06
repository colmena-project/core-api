const { Parse } = global;

const AccountService = require('./AccountService');
const PushService = require('./PushService');
const { NOTIFICATION_TYPES } = require('../constants');
const { replaceInTemplate } = require('../utils');

const getNotificationTemplate = async (type, language) => {
  const query = new Parse.Query('NotificationTemplate');
  query.equalTo('type', type);
  query.equalTo('language', language);
  const NotificationTemplate = await query.first({ useMasterKey: true });

  if (!NotificationTemplate) {
    throw new Error(`Cannot found any template for type: ${type} and language: ${language}`);
  }
  return NotificationTemplate;
};

const notifyTransferRequest = async (transactionId, fromUser, toUser) => {
  if (!transactionId) throw new Error(`Cannot send notification to an empty ${transactionId}`);
  const [fromAccount, toAccount] = await Promise.all([
    AccountService.findAccountByUser(fromUser),
    AccountService.findAccountByUser(toUser),
  ]);

  const language = toAccount.get('defaultLanguage');
  const notificationTemplate = await getNotificationTemplate(NOTIFICATION_TYPES.TRANSFER_REQUEST, language);

  const message = replaceInTemplate(notificationTemplate.get('template'), {
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

const notifyTransport = async (transactionId, from, users = []) => {
  if (!transactionId) throw new Error(`Cannot send notification to an empty ${transactionId}`);
  // const fromAccount = await AccountService.findAccountByUser(from);
  const usersAccount = await Promise.all(users.map((u) => AccountService.findAccountByUser(u)));

  const languages = usersAccount.reduce((langs, account) => {
    const language = account.get('defaultLanguage');
    if (!langs.has(language)) {
      langs.set(language, language);
    }
    return langs;
  }, new Map());

  const templates = await Promise.all(
    Array.from(languages.keys()).map((l) => getNotificationTemplate(NOTIFICATION_TYPES.TRANSPORT, l)),
  );

  const pushes = await Promise.all(
    usersAccount.map((toAccount) => {
      const language = toAccount.get('defaultLanguage');
      const notificationTemplate = templates.find((t) => t.get('language') === language);
      const message = replaceInTemplate(notificationTemplate.get('template'), {
        user: toAccount.get('nickname'),
      });
      return PushService.sendPushNotificationToUser(
        NOTIFICATION_TYPES.TRANSFER_REQUEST,
        message,
        {
          transactionId,
        },
        toAccount.get('user'),
      );
    }),
  );

  return pushes;
};

module.exports = {
  notifyTransferRequest,
  notifyTransport,
};
