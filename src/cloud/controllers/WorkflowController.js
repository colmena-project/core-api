/* @flow */
import type { ParseObject } from '../../flow-types';

const { WorkflowService } = require('../services');

const registerRecover = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { containers, addressId } = params;
  const transaction: ParseObject = await WorkflowService.registerRecover(containers, addressId, user);
  return transaction.toJSON();
};

const registerTransferRequest = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { containers, to } = params;
  const transaction: ParseObject = await WorkflowService.registerTransferRequest(containers, to, user);
  return transaction.toJSON();
};

const registerTransferAccept = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction: ParseObject = await WorkflowService.registerTransferAccept(transactionId, user);
  return transaction.toJSON();
};

const registerTransferReject = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { transactionId, reason } = params;
  const transaction: ParseObject = await WorkflowService.registerTransferReject(transactionId, reason, user);
  return transaction.toJSON();
};

const registerTransferCancel = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { transactionId } = params;
  const transaction: ParseObject = await WorkflowService.registerTransferCancel(transactionId, user);
  return transaction.toJSON();
};

const registerTransport = async (request: Object): Promise<Object> => {
  const { user, params } = request;
  const { containers, to } = params;
  const transaction: ParseObject = await WorkflowService.registerTransport(containers, to, user);
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
