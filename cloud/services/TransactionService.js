const { Parse } = global;
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const { Transaction, TransactionDetail } = require('../classes');

const findRawTransaction = async (id, user, master) => {
  try {
    const authOptions = getQueryAuthOptions(user, master);
    const transactionQuery = new Parse.Query('Transaction');
    const transaction = await transactionQuery.get(id, authOptions);

    return transaction;
  } catch (error) {
    throw new Error(`Transaction ${id} not found`);
  }
};

const findTransactionWithDetailsById = async (id, user, master) => {
  const authOptions = getQueryAuthOptions(user, master);
  const transaction = await findRawTransaction(id, user, master);
  const detailQuery = new Parse.Query('TransactionDetail');
  detailQuery.equalTo('transaction', transaction);
  detailQuery.include('container.type');
  const transactionDetail = await detailQuery.find(authOptions);

  transaction.set(
    'details',
    transactionDetail.map((d) => d.toJSON()),
  );

  return transaction;
};

const createTransaction = async (attributes) => {
  const { from = null, to, type, recyclingCenter = null, reason } = attributes;
  const transaction = new Transaction();
  const number = await getValueForNextSequence(Transaction.name);
  transaction.set('type', type);
  transaction.set('from', from);
  transaction.set('to', to);
  transaction.set('number', number);
  transaction.set('recyclingCenter', recyclingCenter);
  transaction.set('reason', reason);
  return transaction;
};

/**
 * Used to rollback a new stored transaction. It destroy from database.
 *
 * @param {Transaction} transaction
 */
const destroyTransaction = async (transaction) => {
  if (transaction) {
    await transaction.destroy({ useMasterKey: true });
  }
  return Promise.resolve();
};

// const rollbackContainersToStatus = async (containers, status, applyFnToEach = null) => {
//   if (containers) {
//     await Promise.all(
//       containers.map((container) => {
//         container.set('status', status);
//         if (applyFnToEach) applyFnToEach(container);
//         return container.save(null, { useMasterKey: true });
//       }),
//     );
//   }
//   return Promise.resolve();
// };

// const rollbackUserStockTo = async (currentStock) => {
//   if (currentStock) {
//     await Promise.all(
//       currentStock.map((stock) => {
//         const ammount = stock.get('ammount');
//         return stock.save({ ammount }, { useMasterKey: true });
//       }),
//     );
//   }
// };

/**
 * Creates one TransactionDetail instance
 *
 * @param {*} transaction
 * @param {*} wasteType
 */
const createTransactionDetail = (transaction, container) => {
  try {
    const transactionDetail = new TransactionDetail();
    const wasteType = container.get('type');
    transactionDetail.set('transaction', transaction);
    transactionDetail.set('qty', wasteType.get('qty'));
    transactionDetail.set('unit', wasteType.get('unit'));
    transactionDetail.set('container', container);
    return transactionDetail;
  } catch (error) {
    throw new Error(`Transaction Detail could not be created. ${error.message}`);
  }
};

module.exports = {
  findRawTransaction,
  findTransactionWithDetailsById,
  createTransaction,
  createTransactionDetail,
  destroyTransaction,
};
