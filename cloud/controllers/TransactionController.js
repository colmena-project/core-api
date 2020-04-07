const { TransactionService } = require('../services');

const findTransactionById = async (request) => {
  const { user, params } = request;
  const { objectId } = params;
  const transaction = await TransactionService.findTransactionWithDetailsById(objectId, user);
  return transaction.toJSON();
};

module.exports = {
  findTransactionById,
};
