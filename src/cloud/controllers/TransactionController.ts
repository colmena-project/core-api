import { TransactionService } from '../services';

const findTransactionById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { objectId } = params;
  const transaction = await TransactionService.findTransactionWithDetailsById(objectId, user);
  return transaction.toJSON();
};

export default {
  findTransactionById,
};
