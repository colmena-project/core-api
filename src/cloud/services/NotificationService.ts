
import AccountService from './AccountService';
import PushService from './PushService';
import { NOTIFICATION_TYPES } from '../constants';
import { replaceInTemplate } from '../utils';

const getNotificationTemplate = async (type: Colmena.NotificationTypesType, language: string): Promise<Parse.Object> => {
  const query = new Parse.Query('NotificationTemplate');
  query.equalTo('type', type);
  query.equalTo('language', language);
  const NotificationTemplate: Parse.Object | undefined = await query.first({ useMasterKey: true });
  if (!NotificationTemplate) {
    throw new Error(`Cannot found any template for type: ${type} and language: ${language}`);
  }
  return NotificationTemplate;
};

const notifyTransferRequest = async (transactionId: string, fromUser: Parse.User, toUser: Parse.User): Promise<any> => {
  if (!transactionId) throw new Error(`Cannot send notification to an empty ${transactionId}`);
  const [fromAccount, toAccount]: Array<Parse.Object|undefined> = await Promise.all([
    AccountService.findAccountByUser(fromUser),
    AccountService.findAccountByUser(toUser),
  ]);
  if (!fromAccount || !toAccount) throw new Error('from or to account not found');
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

const notifyTransport = async (transactionId: string, from: Parse.User, users: Parse.User[] = []): Promise<any> => {
  if (!transactionId) throw new Error(`Cannot send notification to an empty ${transactionId}`);
  // const fromAccount = await AccountService.findAccountByUser(from);
  const usersAccount = await Promise.all(users.map((u) => AccountService.findAccountByUser(u)));

  const languages = usersAccount.reduce((langs, account) => {
    if (account) {
      const language = account.get('defaultLanguage');
      if (!langs.has(language)) {
        langs.set(language, language);
      }
    }
    return langs;
  }, new Map());

  const templates = await Promise.all(
    Array.from(languages.keys()).map((l) => getNotificationTemplate(NOTIFICATION_TYPES.TRANSPORT, l)),
  );

  const pushes = await Promise.all(
    usersAccount.map((toAccount) => {
      if (toAccount) {
        const language = toAccount.get('defaultLanguage');
        const notificationTemplate = templates.find((t) => t.get('language') === language);
        if (notificationTemplate) {
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
        }
      }
      return Promise.resolve();
    }),
  );

  return pushes;
};

export default {
  notifyTransferRequest,
  notifyTransport,
};
