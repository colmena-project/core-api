/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
const { Parse } = global;
const { Transaction, TransactionDetail } = require('../classes');

const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');
const ContainerService = require('./ContainerService');

const { BAGS_STATUS, MAX_BAGS_QUANTITY_PER_REQUEST, TRANSACTIONS_TYPES } = require('../constants');

const findWasteTypeById = async (id) => {
  const wasteTypeQuery = new Parse.Query('WasteType');
  return wasteTypeQuery.get(id, { useMasterKey: true });
};

const findById = async (id, user, master) => {
  const authOptions = getQueryAuthOptions(user, master);
  const transactionQuery = new Parse.Query('Transaction');
  const transaction = await transactionQuery.get(id, authOptions);

  const detailQuery = new Parse.Query('TransactionDetail');
  detailQuery.equalTo('transaction', transaction);
  detailQuery.include('container');
  detailQuery.include('container.type');
  const transactionDetail = await detailQuery.find(authOptions);

  transaction.set(
    'details',
    transactionDetail.map((d) => d.toJSON()),
  );

  return transaction.toJSON();
};

const createTransactionDetail = async (transaction, wasteTypeId, user) => {
  const authOptions = getQueryAuthOptions(user);
  const wasteType = await findWasteTypeById(wasteTypeId);
  const container = await ContainerService.createContainer(wasteType, BAGS_STATUS.RECOVERED, user);
  try {
    const transactionDetail = new TransactionDetail();
    transactionDetail.set('transaction', transaction);
    transactionDetail.set('qty', wasteType.get('qty'));
    transactionDetail.set('unit', wasteType.get('unit'));
    transactionDetail.set('container', container);
    await transactionDetail.save(null, authOptions);
    return transactionDetail;
  } catch (error) {
    if (container) container.destroy({ useMasterKey: true });
    throw error;
  }
};

const createManyTransactionsDetail = async (qty, transaction, typeId, user) => {
  const promises = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qty; i++) {
    promises.push(createTransactionDetail(transaction, typeId, user));
  }
  const details = await Promise.all(promises);
  return details;
};

const registerRecover = async (containers = [], user) => {
  let transaction;
  containers.forEach(({ qty }) => {
    if (qty > MAX_BAGS_QUANTITY_PER_REQUEST) {
      throw new Error(
        `Max bags quantity per request exceded. Please check your containers data. Current max: ${MAX_BAGS_QUANTITY_PER_REQUEST}`,
      );
    }
  });
  try {
    transaction = new Transaction();
    const number = await getValueForNextSequence(Transaction.name);
    transaction.set('type', TRANSACTIONS_TYPES.RECOVER);
    transaction.set('to', user);
    transaction.set('number', number);
    await transaction.save(null, { sessionToken: user.getSessionToken() });
    const promises = containers.map(({ typeId, qty }) =>
      createManyTransactionsDetail(qty, transaction, typeId, user),
    );
    await Promise.all(promises);

    // return transaction;
    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    console.log(error);
    if (transaction) await transaction.destroy({ useMasterKey: true });
    throw new Error('Transaction could not be registered.');
  }
};

module.exports = {
  registerRecover,
  findById,
};
