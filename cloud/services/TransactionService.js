const { Parse } = global;
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const { Transaction, TransactionDetail } = require('../classes');
const WasteTypeService = require('./WasteTypeService');
const ContainerService = require('./ContainerService');
const StockService = require('./StockService');
const UserService = require('./UserService');
const SecurityService = require('./SecurityService');

const {
  CONTAINER_STATUS,
  MAX_CONTAINERS_QUANTITY_PER_REQUEST,
  TRANSACTIONS_TYPES,
} = require('../constants');

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

const createTransaction = async (from = null, to, type, sessionToken) => {
  const transaction = new Transaction();
  const number = await getValueForNextSequence(Transaction.name);
  transaction.set('type', type);
  transaction.set('from', from);
  transaction.set('to', to);
  transaction.set('number', number);
  await transaction.save(null, { sessionToken });
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

const rollbackContainersToStatus = async (containers, status, applyFnToEach = null) => {
  if (containers) {
    await Promise.all(
      containers.map((container) => {
        container.set('status', status);
        if (applyFnToEach) applyFnToEach(container);
        return container.save(null, { useMasterKey: true });
      }),
    );
  }
  return Promise.resolve();
};

const rollbackUserStockTo = async (currentStock) => {
  if (currentStock) {
    await Promise.all(
      currentStock.map((stock) => {
        const ammount = stock.get('ammount');
        return stock.save({ ammount }, { useMasterKey: true });
      }),
    );
  }
};

const validateRegisterInput = (containers) => {
  const typesMap = new Map();
  containers.forEach(({ typeId, qty }) => {
    if (typesMap.has(typeId)) {
      throw new Error(`Waste Type ${typeId} cannot be duplicated on request.`);
    }
    typesMap.set(typeId, typeId);
    if (qty > MAX_CONTAINERS_QUANTITY_PER_REQUEST) {
      throw new Error(
        `Max container quantity per request exceded. Please check your containers data. Current max: ${MAX_CONTAINERS_QUANTITY_PER_REQUEST}`,
      );
    }
  });
};

const validateTransferAcceptRejectRequest = (transferRequestTransaction, user) => {
  const transactionId = transferRequestTransaction.id;
  if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSFER_REQUEST) {
    throw new Error(
      `Transaction ${transactionId} is not in ${TRANSACTIONS_TYPES.TRANSFER_REQUEST} status.`,
    );
  }
  if (transferRequestTransaction.get('expiredAt')) {
    throw new Error(
      `Transaction ${transactionId} expired at ${transferRequestTransaction.get('expiredAt')}.`,
    );
  }
  if (!transferRequestTransaction.get('to').equals(user)) {
    throw new Error('You are not allowed to accept/reject this request.');
  }
};

/**
 * Creates one TransactionDetail instance
 *
 * @param {*} transaction
 * @param {*} wasteType
 * @param {*} user
 */
const createTransactionDetail = async (transaction, container, user) => {
  try {
    const authOptions = getQueryAuthOptions(user);
    const transactionDetail = new TransactionDetail();
    const wasteType = container.get('type');
    transactionDetail.set('transaction', transaction);
    transactionDetail.set('qty', wasteType.get('qty'));
    transactionDetail.set('unit', wasteType.get('unit'));
    transactionDetail.set('container', container);
    await transactionDetail.save(null, authOptions);
    return transactionDetail;
  } catch (error) {
    throw new Error(`Transaction Detail could not be saved. ${error.message}`);
  }
};

/**
 * Register RECOVER method.
 * Inital point start of colmena recover proccess. It takes an input, wich contains
 * waste type and quantity of containers. It will create a transaction, many transaction details
 * and many container in RECOVERED status for each input.
 *
 * @param {Array} containersInput
 * @param {User} user
 */
const registerRecover = async (containersInput = [], user) => {
  let transaction;
  let currentStock;
  try {
    validateRegisterInput(containersInput);
    const wasteTypes = await WasteTypeService.getWasteTypesFromIds(
      containersInput.map((c) => c.typeId),
    );
    transaction = await createTransaction(
      null,
      user,
      TRANSACTIONS_TYPES.RECOVER,
      user.getSessionToken(),
    );

    const containers = await Promise.all(
      containersInput.map(async ({ typeId, qty }) => {
        const wasteType = wasteTypes.get(typeId);
        return ContainerService.createContainersOfType(
          wasteType,
          qty,
          CONTAINER_STATUS.RECOVERED,
          transaction.get('number'),
          user,
        );
      }),
    );

    await Promise.all(
      containers.flat().map((container) => createTransactionDetail(transaction, container, user)),
    );

    currentStock = await StockService.getUserStock(user);

    await Promise.all(
      containersInput.map((input) => {
        const wasteType = wasteTypes.get(input.typeId);
        return StockService.incrementStock(wasteType, user, input.qty);
      }),
    );
    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findTransactionWithDetailsById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    await destroyTransaction(transaction);
    await rollbackUserStockTo(currentStock);
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Transfer Request method. It accept a container ids array and then generates one Transaction
 * along with many transactions details for each container. Each container status is changed to
 * TRANSFER_PENDING status. No stock movements are generated here.
 *
 * @param {Array} containersInput
 * @param {User} to
 * @param {User} user
 */
const registerTransferRequest = async (containersInput, to, user) => {
  let transaction;
  let containers = [];
  try {
    if (!to) throw new Error("Cannot transfer without a recipient. Please check parameter 'to'");
    const recipient = await UserService.findUserById(to);

    containers = await Promise.all(
      containersInput.map((containerId) => ContainerService.findContainerById(containerId, user)),
    );

    if (!containers.every((container) => container.get('status') === CONTAINER_STATUS.RECOVERED)) {
      throw new Error(
        `Check containers status. To transfer a container to a user It's has to be in ${CONTAINER_STATUS.RECOVERED} status`,
      );
    }

    transaction = await createTransaction(
      user,
      recipient,
      TRANSACTIONS_TYPES.TRANSFER_REQUEST,
      user.getSessionToken(),
    );

    await SecurityService.grantReadAndWritePermissionsToUser(
      'Transaction',
      transaction.id,
      recipient,
    );

    await Promise.all(
      containers.map((container) => {
        container.set('status', CONTAINER_STATUS.TRANSFER_PENDING);
        return SecurityService.grantReadAndWritePermissionsToUser(
          'Container',
          container.id,
          recipient,
        ).then(() => createTransactionDetail(transaction, container, user));
      }),
    );
    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findTransactionWithDetailsById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) {
      await destroyTransaction(transaction);
      await rollbackContainersToStatus(containers, CONTAINER_STATUS.RECOVERED, (container) => {
        SecurityService.revokeReadAndWritePermissionsToUser(
          'Container',
          container.id,
          transaction.get('to'),
        );
      });
    }
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Transfer Accept method. Receive the Transaction Id for a TRASNFER_REQUEST given.
 * Verifies if transaction is valid and then creates a new Transaction and detail for the operation.
 * Each container in the request is set to TRANSFERRED status. Also, move the stock from the owner
 * to the user that request the endpoint.
 *
 * @param {Array} containersInput
 * @param {User} to
 * @param {User} user
 */
const registerTransferAccept = async (transactionId, user) => {
  let transferRequestTransaction;
  let transaction;
  let containers = [];
  try {
    transferRequestTransaction = await findRawTransaction(transactionId, user);
    validateTransferAcceptRejectRequest(transferRequestTransaction, user);
    transaction = await createTransaction(
      transferRequestTransaction.get('from'),
      transferRequestTransaction.get('to'),
      TRANSACTIONS_TYPES.TRANSFER_ACCEPT,
      user.getSessionToken(),
    );
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    containers = await ContainerService.findContainersByTransaction(transferRequestTransaction);

    await Promise.all(
      containers.map((container) => {
        container.set('status', CONTAINER_STATUS.TRANSFERRED);
        return createTransactionDetail(transaction, container, user).then(() => {
          const from = transferRequestTransaction.get('from');
          const to = transferRequestTransaction.get('to');
          return StockService.moveStock(container.get('type'), from, to, 1);
        });
      }),
    );

    const storedTransaction = await findTransactionWithDetailsById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) {
      await destroyTransaction(transaction);
      await rollbackContainersToStatus(containers, CONTAINER_STATUS.TRANSFER_PENDING);
      if (transferRequestTransaction) {
        await transferRequestTransaction.unset('expiredAt');
        await transferRequestTransaction.save(null, { useMasterKey: true });
      }
    }
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransferReject = async (transactionId, user) => {
  let transferRequestTransaction;
  let transaction;
  let containers = [];
  try {
    transferRequestTransaction = await findRawTransaction(transactionId, user);
    validateTransferAcceptRejectRequest(transferRequestTransaction, user);

    transaction = await createTransaction(
      transferRequestTransaction.get('from'),
      transferRequestTransaction.get('to'),
      TRANSACTIONS_TYPES.TRANSFER_REJECT,
      user.getSessionToken(),
    );
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    containers = await ContainerService.findContainersByTransaction(transferRequestTransaction);
    await Promise.all(
      containers.map((container) => {
        container.set('status', CONTAINER_STATUS.RECOVERED);
        return createTransactionDetail(transaction, container, user);
      }),
    );

    const storedTransaction = await findTransactionWithDetailsById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) {
      await destroyTransaction(transaction);
      await rollbackContainersToStatus(containers, CONTAINER_STATUS.TRANSFER_PENDING);
      if (transferRequestTransaction) {
        await transferRequestTransaction.unset('expiredAt');
        await transferRequestTransaction.save(null, { useMasterKey: true });
      }
    }
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransferCancel = async (transactionId, user) => {
  let transferRequestTransaction;
  let transaction;
  let containers = [];
  try {
    transferRequestTransaction = await findRawTransaction(transactionId, user);
    if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSFER_REQUEST) {
      throw new Error(
        `Transaction ${transactionId} is not in ${TRANSACTIONS_TYPES.TRANSFER_REQUEST} status.`,
      );
    }
    if (transferRequestTransaction.get('expiredAt')) {
      throw new Error(
        `Transaction ${transactionId} expired at ${transferRequestTransaction.get('expiredAt')}.`,
      );
    }
    if (!transferRequestTransaction.get('from').equals(user)) {
      throw new Error('You are not allowed to cancel this request.');
    }

    transaction = await createTransaction(
      transferRequestTransaction.get('from'),
      transferRequestTransaction.get('to'),
      TRANSACTIONS_TYPES.TRANSFER_CANCEL,
      user.getSessionToken(),
    );
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    containers = await ContainerService.findContainersByTransaction(transferRequestTransaction);
    await Promise.all(
      containers.map((container) => {
        container.set('status', CONTAINER_STATUS.RECOVERED);
        return SecurityService.revokeReadAndWritePermissionsToUser(
          'Container',
          container.id,
          transferRequestTransaction.get('to'),
        ).then(() => createTransactionDetail(transaction, container, user));
      }),
    );

    const storedTransaction = await findTransactionWithDetailsById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) {
      await destroyTransaction(transaction);
      if (transferRequestTransaction) {
        await rollbackContainersToStatus(
          containers,
          CONTAINER_STATUS.TRANSFER_PENDING,
          (container) => {
            SecurityService.grantReadAndWritePermissionsToUser(
              'Container',
              container.id,
              transferRequestTransaction.get('to'),
            );
          },
        );
        await transferRequestTransaction.unset('expiredAt');
        await transferRequestTransaction.save(null, { useMasterKey: true });
      }
    }
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

module.exports = {
  findTransactionWithDetailsById,
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
  registerTransferCancel,
};
