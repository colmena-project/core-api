import { getQueryAuthOptions } from '../utils';
import { getValueForNextSequence } from '../utils/db';
import { Transaction, TransactionDetail } from '../classes';
import { TRANSACTIONS_TYPES } from '../constants';

const findRawTransaction = async (
  id: string,
  user: Parse.User,
  master: boolean = false,
): Promise<Parse.Object> => {
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

  const queryRetribution = new Parse.Query('Retribution');
  queryRetribution.equalTo('transaction', transaction.toPointer());
  const retribution: Parse.Object | undefined = await queryRetribution.first(authOptions);

  if (retribution) {
    transaction.set('retribution', retribution.toJSON());
  }

  const queryConfirmRetribution = new Parse.Query('Retribution');
  queryConfirmRetribution.equalTo('confirmationTransaction', transaction.toPointer());
  const retributionConfirmation: Parse.Object[] = await queryConfirmRetribution.find(authOptions);
  if (retributionConfirmation.length > 0) {
    transaction.set(
      'retributionConfirm',
      retributionConfirmation.map((element) => element.toJSON()),
    );
  }

  const queryPayment = new Parse.Query('PaymentTransaction');
  queryPayment.equalTo('transaction', transaction.toPointer());
  const paymentTransaction: Parse.Object[] = await queryPayment.find(authOptions);
  if (paymentTransaction.length > 0) {
    transaction.set(
      'paymentTransaction',
      paymentTransaction.map((element) => element.toJSON()),
    );
  }

  return transaction;
};

const createTransaction = async (attributes: Colmena.TransactionType): Promise<Parse.Object> => {
  const {
    from,
    to,
    type,
    recyclingCenter,
    reason,
    fromAddress,
    toAddress,
    kms,
    estimatedDuration,
    estimatedDistance,
    trackingCode,
  } = attributes;
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
  transaction.set('kms', kms);
  transaction.set('estimatedDuration', estimatedDuration);
  transaction.set('estimatedDistance', estimatedDistance);
  transaction.set('trackingCode', trackingCode?.toString());
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
const createTransactionDetail = (
  transaction: Parse.Object,
  container: Parse.Object,
): Parse.Object => {
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

const findRecoverTransactionOfContainer = async (
  container: Parse.Object,
): Promise<Parse.Object | undefined> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container.toPointer());
  const transactionsDetail: Parse.Object[] = await query.find({ useMasterKey: true });
  let transaction: Parse.Object | undefined;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.RECOVER) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

const findTransferAcceptTransactionOfContainer = async (
  container: Parse.Object,
): Promise<Parse.Object | undefined> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('transaction');
  query.include('transaction');
  query.equalTo('container', container.toPointer());
  const transactionsDetail: Parse.Object[] = await query.find({ useMasterKey: true });
  let transaction: Parse.Object | undefined;
  transactionsDetail.forEach((detail) => {
    if (detail.get('transaction').get('type') === TRANSACTIONS_TYPES.TRANSFER_ACCEPT) {
      transaction = detail.get('transaction');
    }
  });
  return transaction;
};

const findTransactionDetails = async (transaction: Parse.Object): Promise<Parse.Object[]> => {
  const authOptions = getQueryAuthOptions(undefined, true);
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.equalTo('transaction', transaction);
  query.include('container.type');
  const details: Promise<Parse.Object[]> = query.find(authOptions);
  return details;
};

/**
 *
 * Add the the Recycling Center's Role to: transaction, transactionDetails, container y retribution
 *
 * @param recyclingCenter : Parse.Object
 * @param transaction : Parse.Object
 * @param transactionDetails : Parse.Object[]
 */
const addRoleFactoryToTransacction = async (
  recyclingCenter: Parse.Object,
  transaction: Parse.Object,
  transactionDetails: Parse.Object[],
) => {
  const role: Parse.Role | undefined = await recyclingCenter.get('role');

  if (role) {
    let acl: Parse.ACL | undefined = transaction.getACL();
    if (!acl) {
      acl = new Parse.ACL();
    }
    await role.fetch();
    acl.setRoleReadAccess(role, true);
    acl.setRoleWriteAccess(role, true);
    transaction.setACL(acl);
    transaction.save(null, { useMasterKey: true });

    transactionDetails.forEach(async (detail) => {
      let aclDetail: Parse.ACL | undefined = detail.getACL();
      if (!aclDetail) {
        aclDetail = new Parse.ACL();
      }
      if (role) {
        aclDetail.setRoleReadAccess(role, true);
        aclDetail.setRoleWriteAccess(role, true);
        detail.setACL(aclDetail);
        detail.save(null, { useMasterKey: true });

        const container: Parse.Object = detail.get('container');

        let aclContainer: Parse.ACL | undefined = detail.getACL();
        if (!aclContainer) {
          aclContainer = new Parse.ACL();
        }
        aclContainer.setRoleReadAccess(role, true);
        aclContainer.setRoleWriteAccess(role, true);
        container.setACL(aclContainer);
        container.save(null, { useMasterKey: true });
      }
    });

    const queryRetribution: Parse.Query = new Parse.Query('Retribution');
    queryRetribution.equalTo('transaction', transaction);
    const retributions: Parse.Object[] = await queryRetribution.find({
      useMasterKey: true,
    });

    retributions.forEach((retribution) => {
      let aclRetribution: Parse.ACL | undefined = retribution.getACL();
      if (!aclRetribution) {
        aclRetribution = new Parse.ACL();
      }
      aclRetribution.setRoleReadAccess(role, true);
      aclRetribution.setRoleWriteAccess(role, true);
      retribution.setACL(aclRetribution);
      retribution.save(null, { useMasterKey: true });
    });
  }
};

/**
 * Search for the history transaction where the container participated.
 * Foreach transaction is add transacion detail and the retribution
 *
 * @param containerId: any[]
 * @param user: Parse.User
 * @param master: boolean
 */
const generateHistoryTransactionFromContainer = async (
  containerId: any[],
  user: Parse.User,
  master: boolean = false,
) => {
  const detailContQuery = new Parse.Query('TransactionDetail');
  detailContQuery.containedIn('container', containerId);
  detailContQuery.ascending('createdAt');

  const transactionContainerDetail = await detailContQuery.find({ useMasterKey: true });

  const historyTransactionDetail = transactionContainerDetail.map((d) => d.toJSON());

  const historyWithTransaction = await Promise.all(
    historyTransactionDetail.map((transactionDetail) => {
      const transactionId = transactionDetail.transaction.objectId;
      const trans = findTransactionWithDetailsById(
        transactionId,
        user,
        master,
      ).then((transaction) => transaction.toJSON());
      return trans;
    }),
  );
  return historyWithTransaction;
};

/**
 * Find by Transaction father all the transaction history group by container
 * Fist find the transaction father, then search all the deailts of the transaction.
 * After for each trransaction detail looks for its container.
 * Then search for the history where the container participated.
 *
 * Thre return is a json response with all the data
 *
 * @param id : string
 * @param user : Parse.User
 * @param master : booelan
 */
const findTransactionHistoryContainerById = async (
  id: string,
  user: Parse.User,
  master: boolean = false,
): Promise<Parse.Object> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, master);

  // Find the Transaction
  const transaction: Parse.Object = await findRawTransaction(id, user, master);

  // Search all the transaction details
  const detailQuery: Parse.Query = new Parse.Query('TransactionDetail');
  detailQuery.equalTo('transaction', transaction.toPointer());
  detailQuery.include('container.type');
  const transactionDetail: Parse.Object[] = await detailQuery.find(authOptions);

  // const container = [];

  // For each Transaction detail, then get the container, and find the history of transaction
  const container = await Promise.all(
    transactionDetail.map((detail) => {
      const containerId = [detail.get('container').id];

      // Find all the history from a specific container
      const historyWithTransaction = generateHistoryTransactionFromContainer(
        containerId,
        user,
        master,
      ).then((hTransaction) => ({
        containerId: detail.get('container').id,
        containerName: detail.get('container').get('code'),
        history: hTransaction,
      }));
      return historyWithTransaction;
      // return the the container id, container coide and the history
    }),
  );
  transaction.set('container', container);

  const queryRetribution = new Parse.Query('Retribution');
  queryRetribution.equalTo('transaction', transaction.toPointer());
  const retribution: Parse.Object | undefined = await queryRetribution.first(authOptions);

  transaction.set(
    'details',
    transactionDetail.map((d) => d.toJSON()),
  );

  if (retribution) {
    transaction.set('retribution', retribution.toJSON());
  }

  return transaction;
};

export default {
  findRawTransaction,
  findTransactionDetails,
  findTransactionWithDetailsById,
  findTransactionsOfContainer,
  findRecoverTransactionOfContainer,
  findTransferAcceptTransactionOfContainer,
  createTransaction,
  createTransactionDetail,
  destroyTransaction,
  addRoleFactoryToTransacction,
  findTransactionHistoryContainerById,
  generateHistoryTransactionFromContainer,
};
