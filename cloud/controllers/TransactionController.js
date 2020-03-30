const { TransactionService } = require('../services');

const registerRecover = async (request) => {
  const { user, params } = request;
  const { containers } = params;
  const transaction = await TransactionService.registerRecover(containers, user);
  return transaction.toJSON();
};

const registerTransferRequest = async (request) => {
  const { user, params } = request;
  const { containers, to } = params;
  const transaction = await TransactionService.registerTransferRequest(containers, to, user);
  return transaction.toJSON();
};

const registerTransferAccept = async (request) => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction = await TransactionService.registerTransferAccept(transactionId, user);
  return transaction.toJSON();
};

const registerTransferReject = async (request) => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction = await TransactionService.registerTransferReject(transactionId, user);
  return transaction.toJSON();
};

const findTransactionById = async (request) => {
  const { user, params } = request;
  const { objectId } = params;
  const transaction = await TransactionService.findTransactionWithDetailsById(objectId, user);
  return transaction.toJSON();
};

module.exports = {
  findTransactionById,
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
};
