/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */
const { Parse } = global;
const { Transaction, TransactionDetail } = require('../classes');

const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');
const ContainerService = require('./ContainerService');
const StockService = require('./StockService');
const WasteTypeService = require('./WasteTypeService');

const {
  CONTAINER_STATUS,
  MAX_CONTAINERS_QUANTITY_PER_REQUEST,
  TRANSACTIONS_TYPES,
} = require('../constants');

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

const createTransaction = async (user) => {
  const transaction = new Transaction();
  const number = await getValueForNextSequence(Transaction.name);
  transaction.set('type', TRANSACTIONS_TYPES.RECOVER);
  transaction.set('to', user);
  transaction.set('number', number);
  return transaction.save(null, { sessionToken: user.getSessionToken() });
};

const createTransactionDetail = async (transaction, wasteType, user) => {
  const authOptions = getQueryAuthOptions(user);
  const container = await ContainerService.createContainer(
    wasteType,
    CONTAINER_STATUS.RECOVERED,
    user,
  );
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

const createManyTransactionsDetail = async (transaction, wasteType, qty, user) => {
  const promises = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qty; i++) {
    promises.push(createTransactionDetail(transaction, wasteType, user));
  }
  const details = await Promise.all(promises);
  return details;
};

const runRecoverValidations = (containers) => {
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

const retrieveWasteTypes = async (containers) => {
  const wasteTypes = new Map();
  const promisses = containers.map((c) => WasteTypeService.findWasteTypeById(c.typeId));
  const types = await Promise.all(promisses);
  types.forEach((t) => wasteTypes.set(t.id, t));
  return wasteTypes;
};

const registerRecover = async (containers = [], user) => {
  let transaction;
  try {
    runRecoverValidations(containers);
    const wasteTypes = await retrieveWasteTypes(containers);
    transaction = await createTransaction(user);
    const promises = containers.map(({ typeId, qty }) => {
      const wasteType = wasteTypes.get(typeId);
      createManyTransactionsDetail(transaction, wasteType, qty, user);
    });

    // wait for all promisses are resolved or rejected
    // const transactionDetails = await Promise.allSettled(promises);
    const transactionDetails = await Promise.allSettled(promises);
    // if one is rejected throw the first reason
    if (transactionDetails.some((td) => td.status === 'rejected')) {
      const { reason } = transactionDetails
        .filter((td) => td.status === 'rejected')
        .shift();
      throw new Error(reason);
    }
    const stockPromisses = containers.map(({ typeId, qty }) =>
      StockService.incrementStock(typeId, user, qty),
    );

    await Promise.all(stockPromisses);
    // query to server in order to return stored value, NOT in memory value.
    const storedTransaction = await findById(transaction.id, user);
    return storedTransaction;
  } catch (error) {
    if (transaction) await transaction.destroy({ useMasterKey: true });
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

module.exports = {
  registerRecover,
  findById,
};
