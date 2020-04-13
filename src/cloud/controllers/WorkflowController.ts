import { WorkflowService } from '../services';

const registerRecover = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { containers, addressId } = params;
  const transaction: Parse.Object = await WorkflowService.registerRecover(containers, addressId, user);
  return transaction.toJSON();
};

const registerTransferRequest = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { containers, to } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferRequest(containers, to, user);
  return transaction.toJSON();
};

const registerTransferAccept = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { transactionId } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferAccept(transactionId, user);
  return transaction.toJSON();
};

const registerTransferReject = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { transactionId, reason } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferReject(transactionId, reason, user);
  return transaction.toJSON();
};

const registerTransferCancel = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { transactionId } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransferCancel(transactionId, user);
  return transaction.toJSON();
};

const registerTransport = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { containers, to } = params;
  const transaction: Parse.Object = await WorkflowService.registerTransport(containers, to, user);
  return transaction.toJSON();
};

export default {
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
  registerTransferCancel,
  registerTransport,
};
