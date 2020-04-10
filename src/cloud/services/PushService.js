/* @flow */
import type { NotificationDataType, NotificationTypesType, ParseUser } from '../../flow-types';

const { Parse } = global;
const { NOTIFICATION_TYPES } = require('../constants');

const send = async (title: string): Promise<any> =>
  Parse.Push.send(
    {
      channels: ['All'],
      data: {
        title,
      },
    },
    {
      useMasterKey: true,
    },
  );

const sendToUser = async (data: Object, user: ParseUser): Promise<any> => {
  if (!data) throw new Error('Cannot send notificaction. Data is required');
  // Find sessions of the user.
  const query = new Parse.Query(Parse.Session);
  query.equalTo('user', user);
  const now = new Date();
  query.greaterThan('expiresAt', now);
  // return query; // Find devices associated with the user
  const pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.matchesKeyInQuery('installationId', 'installationId', query);

  // Send push notification to query
  return Parse.Push.send(
    {
      where: pushQuery,
      data,
    },
    {
      useMasterKey: true,
    },
  );
};

const prepareNotificationData = (type: NotificationTypesType, message, data: Object = {}): NotificationDataType => {
  if (!Object.keys(NOTIFICATION_TYPES).includes(type)) {
    throw new Error(`Unsoported push notification type ${type}`);
  }

  return {
    type,
    message,
    data,
  };
};

const sendPushNotificationToUser = async (
  type: NotificationTypesType,
  message: string,
  extraData: Object,
  user: ParseUser,
): Promise<any> => {
  const data: NotificationDataType = prepareNotificationData(type, message.trim(), extraData);
  return sendToUser(data, user);
};

module.exports = {
  send,
  sendPushNotificationToUser,
};
