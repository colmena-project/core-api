import { WorkflowService } from '../services';

const registerRecover = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { containers, addressId } = params;
  const transaction: Parse.Object = await WorkflowService.registerRecover(
    containers,
    addressId,
    user,
  );
  return transaction.toJSON();
};

const registerTransferRequest = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { containers, to } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferRequest(
    containers,
    to,
    user,
  );
  return transaction.toJSON();
};

const registerTransferAccept = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { transactionId } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferAccept(
    transactionId,
    user,
  );
  return transaction.toJSON();
};

const registerTransferReject = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { transactionId, reason } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferReject(
    transactionId,
    reason,
    user,
  );
  return transaction.toJSON();
};

const registerTransferCancel = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { transactionId } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferCancel(
    transactionId,
    user,
  );
  return transaction.toJSON();
};

const registerTransport = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { containers, to } = params;
  const transaction = await WorkflowService.registerTransport(containers, to, user);
  return transaction.toJSON();
};

const registerTransportCancel = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { transactionId, reason } = params;
  const transaction = await WorkflowService.registerTransportCancel(transactionId, reason, user);
  return transaction.toJSON();
};

const deleteContainers = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { containers } = params;
  const transaction = await WorkflowService.deleteContainers(containers, user);
  return transaction.toJSON();
};

export default {
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
  registerTransferCancel,
  registerTransport,
  registerTransportCancel,
  deleteContainers,
};
