const { WorkflowService } = require('../services');

const registerRecover = async (request) => {
  const { user, params } = request;
  const { containers } = params;
  const transaction = await WorkflowService.registerRecover(containers, user);
  return transaction.toJSON();
};

const registerTransferRequest = async (request) => {
  const { user, params } = request;
  const { containers, to } = params;
  const transaction = await WorkflowService.registerTransferRequest(containers, to, user);
  return transaction.toJSON();
};

const registerTransferAccept = async (request) => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction = await WorkflowService.registerTransferAccept(transactionId, user);
  return transaction.toJSON();
};

const registerTransferReject = async (request) => {
  const { user, params } = request;
  const { transactionId, reason } = params;
  const transaction = await WorkflowService.registerTransferReject(transactionId, reason, user);
  return transaction.toJSON();
};

const registerTransferCancel = async (request) => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction = await WorkflowService.registerTransferCancel(transactionId, user);
  return transaction.toJSON();
};

const registerTransport = async (request) => {
  const { user, params } = request;
  const { containers, to } = params;
  const transaction = await WorkflowService.registerTransport(containers, to, user);
  return transaction.toJSON();
};

module.exports = {
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
  registerTransferCancel,
  registerTransport,
};
