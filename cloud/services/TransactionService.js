const { Parse } = global;
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');

const { Transaction, TransactionDetail } = require('../classes');
const WasteTypeService = require('./WasteTypeService');
const ContainerService = require('./ContainerService');
const StockService = require('./StockService');
const UserService = require('./UserService');

const {
  CONTAINER_STATUS,
  MAX_CONTAINERS_QUANTITY_PER_REQUEST,
  TRANSACTIONS_TYPES,
} = require('../constants');

const findTransactionById = async (id, user, master) => {
  const authOptions = getQueryAuthOptions(user, master);
  const transactionQuery = new Parse.Query('Transaction');
  const transaction = await transactionQuery.get(id, authOptions);

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
  return transaction.save(null, { sessionToken });
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

/**
 * Creates one TransactionDetail instance
 *
 * @param {*} transaction
 * @param {*} wasteType
 * @param {*} user
 */
const createTransactionDetail = async (transaction, container, user) => {
  const authOptions = getQueryAuthOptions(user);
  const transactionDetail = new TransactionDetail();
  const wasteType = container.get('type');

  transactionDetail.set('transaction', transaction);
  transactionDetail.set('qty', wasteType.get('qty'));
  transactionDetail.set('unit', wasteType.get('unit'));
  transactionDetail.set('container', container);
  await transactionDetail.save(null, authOptions);
  return transactionDetail;
};

/**
 * Register RECOVER method.
 * Inital point start of colmena recover proccess. It takes an input, wich contains
 * waste type and quantity of containers. It will create a transaction, many transaction details
 * and many container for each input.
 *
 * @param {Array} containersInput
 * @param {*} user
 */
const registerRecover = async (containersInput = [], user) => {
  let transaction;
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
          user,
        );
      }),
    );

    await Promise.all(
      containers.flat().map((container) => createTransactionDetail(transaction, container, user)),
    );

    await Promise.all(
      containersInput.map((input) => StockService.incrementStock(input.typeId, user, input.qty)),
    );

    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findTransactionById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) await transaction.destroy({ useMasterKey: true });
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransferRequest = async (containersInput, to, user) => {
  let transaction;
  try {
    if (!to) throw new Error("Cannot transfer without a recipient. Please check parameter 'to'");
    const recipient = await UserService.findUserById(to);

    const containers = await Promise.all(
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

    containers.map((container) => container.set('status', CONTAINER_STATUS.TRANSFER_PENDING));

    await Promise.all(
      containers.map((container) => createTransactionDetail(transaction, container, user)),
    );

    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findTransactionById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) await transaction.destroy({ useMasterKey: true });
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

module.exports = {
  findTransactionById,
  registerRecover,
  registerTransferRequest,
};
