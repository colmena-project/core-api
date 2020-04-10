/* @flow */
import type { ParseObject, ParseUser, TransactionType } from '../../flow-types';

const { Parse } = global;
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const { Transaction, TransactionDetail } = require('../classes');
const { TRANSACTIONS_TYPES } = require('../constants');

const findRawTransaction = async (id: string, user: ParseUser, master: boolean = false): Promise<ParseObject> => {
  try {
    const authOptions = getQueryAuthOptions(user, master);
    const transactionQuery = new Parse.Query('Transaction');
    const transaction = await transactionQuery.get(id, authOptions);
    return transaction;
  } catch (error) {
    throw new Error(`Transaction ${id} not found`);
  }
};

const findTransactionWithDetailsById = async (
  id: string,
  user: ParseUser,
  master?: boolean = false,
): Promise<ParseObject> => {
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

const createTransaction = async (attributes: TransactionType): Promise<ParseObject> => {
  const { from = null, to, type, recyclingCenter = null, reason, address = {} } = attributes;
  const transaction = new Transaction();
  const number = await getValueForNextSequence(Transaction.name);
  transaction.set('type', type);
  transaction.set('from', from);
  transaction.set('to', to);
  transaction.set('number', number);
  transaction.set('recyclingCenter', recyclingCenter);
  transaction.set('reason', reason);
  transaction.set('address', address);
  return transaction;
};

/**
 * Used to rollback a new stored transaction. It destroy from database.
 *
 * @param {Transaction} transaction
 */
const destroyTransaction = async (transaction: ParseObject): Promise<any> => {
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
const createTransactionDetail = (transaction: ParseObject, container: ParseObject): Object => {
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

/**
 * Returns all transactions associated to a container
 *
 * @param {Container} container
 */
const findTransactionsOfContainer = async (container: ParseObject): Promise<ParseObject[]> => {
  const query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container);
  const transactionsDetails = await query.find({ useMasterKey: true });
  return transactionsDetails.map((detail) => detail.get('transaction'));
};

const findRecoverTransactionOfContainer = async (container: ParseObject): Promise<?ParseObject> => {
  const query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container);
  const transactionsDetail = await query.find({ useMasterKey: true });
  let transaction = null;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.RECOVER) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

const findTransferAcceptTransactionOfContainer = async (container: ParseObject): Promise<?ParseObject> => {
  const query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container);
  const transactionsDetail = await query.find({ useMasterKey: true });
  let transaction = null;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.TRANSFER_ACCEPT) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

module.exports = {
  findRawTransaction,
  findTransactionWithDetailsById,
  findTransactionsOfContainer,
  findRecoverTransactionOfContainer,
  findTransferAcceptTransactionOfContainer,
  createTransaction,
  createTransactionDetail,
  destroyTransaction,
};
