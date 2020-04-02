const { Parse } = global;
const { NOTIFICATION_TYPES } = require('../constants');

const send = async (title) => {
  const push = await Parse.Push.send(
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
  return push;
};

const sendToUser = async (data, user) => {
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

const prepareNotificationData = (type, message, data = {}) => {
  if (!Object.keys(NOTIFICATION_TYPES).includes(type)) {
    throw new Error(`Unsoported push notification type ${type}`);
  }

  return {
    type,
    message,
    data,
  };
};

const sendPushNotificationToUser = async (type, message, extraData, user) => {
  const data = prepareNotificationData(type, message.trim(), extraData);
  return sendToUser(data, user);
};

module.exports = {
  send,
  sendPushNotificationToUser,
};
