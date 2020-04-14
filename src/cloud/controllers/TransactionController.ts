import { TransactionService } from '../services';

const findTransactionById = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }>request;
  const { objectId } = params;
  const transaction = await TransactionService.findTransactionWithDetailsById(objectId, user);
  return transaction.toJSON();
};

export default {
  findTransactionById,
};
