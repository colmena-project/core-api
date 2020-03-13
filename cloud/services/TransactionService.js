/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
const { Parse } = global;
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const { BAGS_STATUS, MAX_BAGS_QUANTITY_PER_REQUEST, TRANSACTIONS_TYPES } = require('../constants');

const findWasteTypeById = async (id) => {
  const wasteTypeQuery = new Parse.Query('WasteType');
  return wasteTypeQuery.get(id, { useMasterKey: true });
};

const createBag = async (type, status, user) => {
  const authOptions = getQueryAuthOptions(user);
  const number = await getValueForNextSequence('bag');
  const bag = new Parse.Object('Bag');
  bag.set('status', status);
  bag.set('number', number);
  bag.set('type', type);
  await bag.save(null, authOptions);
  return bag;
};

const createTransactionDetail = async (transaction, wasteTypeId, user) => {
  const authOptions = getQueryAuthOptions(user);
  const wasteType = await findWasteTypeById(wasteTypeId);
  const bag = await createBag(wasteType, BAGS_STATUS.RECOVERED, user);
  try {
    const transactionDetail = new Parse.Object('TransactionDetail');
    transactionDetail.set('transaction', transaction);
    transactionDetail.set('qty', wasteType.get('qty'));
    transactionDetail.set('unit', wasteType.get('unit'));
    transactionDetail.set('bag', bag);
    await transactionDetail.save(null, authOptions);
    return transactionDetail;
  } catch (error) {
    if (bag) bag.destroy({ useMasterKey: true });
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

const registerRecover = async (detail = [], user) => {
  let transaction;
  const quantities = detail.map((d) => d.qty);
  quantities.forEach((q) => {
    if (q > MAX_BAGS_QUANTITY_PER_REQUEST) {
      throw new Error(
        `Max bags quantity per request exceded. Please check your detail. Current max: ${MAX_BAGS_QUANTITY_PER_REQUEST}`,
      );
    }
  });
  try {
    transaction = new Parse.Object('Transaction');
    const number = await getValueForNextSequence('transaction');
    transaction.set('type', TRANSACTIONS_TYPES.RECOVER);
    transaction.set('to', user);
    transaction.set('number', number);
    await transaction.save(null, { sessionToken: user.getSessionToken() });
    const promises = detail.map(({ typeId, qty }) =>
      createManyTransactionsDetail(qty, transaction, typeId, user),
    );
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    // console.log(error);
    if (transaction) await transaction.destroy();
    throw new Error('Transaction could not be registered.');
  }
};

module.exports = {
  registerRecover,
};
