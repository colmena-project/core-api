import { TransactionService } from '../services';

const findTransactionById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { objectId } = params;
  const transaction = await TransactionService.findTransactionWithDetailsById(objectId, user);
  return transaction.toJSON();
};

const findTransactionHistoryContainerById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { params, user } = request;
  const { transactionId } = params;

  const transaction = await TransactionService.findTransactionHistoryContainerById(
    transactionId,
    user,
    true,
  );
  return transaction.toJSON();
};

export default {
  findTransactionById,
  findTransactionHistoryContainerById,
};
