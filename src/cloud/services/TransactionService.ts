import Parse from '../parse';

import { Colmena } from '../../types';
import { getQueryAuthOptions } from '../utils';
import { getValueForNextSequence } from '../utils/db';
import { Transaction, TransactionDetail } from'../classes';
import { TRANSACTIONS_TYPES } from'../constants';

const findRawTransaction = async (id: string, user: Parse.User, master: boolean = false): Promise<Parse.Object> => {
  try {
    const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, master);
    const transactionQuery: Parse.Query = new Parse.Query('Transaction');
    const transaction: Parse.Object = await transactionQuery.get(id, authOptions);
    return transaction;
  } catch (error) {
    throw new Error(`Transaction ${id} not found`);
  }
};

const findTransactionWithDetailsById = async (
  id: string,
  user: Parse.User,
  master: boolean = false,
): Promise<Parse.Object> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, master);
  const transaction: Parse.Object = await findRawTransaction(id, user, master);
  const detailQuery: Parse.Query = new Parse.Query('TransactionDetail');
  detailQuery.equalTo('transaction', transaction.toPointer());
  detailQuery.include('container.type');
  const transactionDetail: Parse.Object[] = await detailQuery.find(authOptions);

  transaction.set(
    'details',
    transactionDetail.map((d) => d.toJSON()),
  );

  return transaction;
};

const createTransaction = async (attributes: Colmena.TransactionType): Promise<Parse.Object> => {
  const { from, to, type, recyclingCenter, reason, fromAddress, toAddress } = attributes;
  const transaction: Parse.Object = new Transaction();
  const number: number = await getValueForNextSequence(Transaction.name);


  transaction.set('type', type);
  transaction.set('from', from);
  transaction.set('to', to);
  transaction.set('number', number);
  transaction.set('recyclingCenter', recyclingCenter);
  transaction.set('reason', reason);
  transaction.set('fromAddress', fromAddress);
  transaction.set('toAddress', toAddress);
  return transaction;
};

/**
 * Used to rollback a new stored transaction. It destroy from database.
 *
 * @param {Transaction} transaction
 */
const destroyTransaction = async (transaction: Parse.Object): Promise<any> => {
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
const createTransactionDetail = (transaction: Parse.Object, container: Parse.Object): Parse.Object => {
  try {
    const transactionDetail: Parse.Object = new TransactionDetail();
    const wasteType: Parse.Object = container.get('type');
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
const findTransactionsOfContainer = async (container: Parse.Object): Promise<Parse.Object[]> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container.toPointer());
  const transactionsDetails: Parse.Object[] = await query.find({ useMasterKey: true });
  return transactionsDetails.map((detail) => detail.get('transaction'));
};

const findRecoverTransactionOfContainer = async (container: Parse.Object): Promise<Parse.Object|undefined> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container.toPointer());
  const transactionsDetail: Parse.Object[] = await query.find({ useMasterKey: true });
  let transaction: Parse.Object|undefined;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.RECOVER) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

const findTransferAcceptTransactionOfContainer = async (container: Parse.Object): Promise<Parse.Object|undefined> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container.toPointer());
  const transactionsDetail: Parse.Object[] = await query.find({ useMasterKey: true });
  let transaction: Parse.Object|undefined;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.TRANSFER_ACCEPT) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

export default {
  findRawTransaction,
  findTransactionWithDetailsById,
  findTransactionsOfContainer,
  findRecoverTransactionOfContainer,
  findTransferAcceptTransactionOfContainer,
  createTransaction,
  createTransactionDetail,
  destroyTransaction,
};
