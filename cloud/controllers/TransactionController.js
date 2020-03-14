const { TransactionService } = require('../services');

const registerRecover = async (request) => {
  const { user, params } = request;
  const { containers } = params;
  const transaction = await TransactionService.registerRecover(containers, user);
  return transaction;
};

const findById = async (request) => {
  const { user, params } = request;
  const { objectId } = params;
  const transaction = await TransactionService.findById(objectId, user);
  return transaction;
};

module.exports = {
  registerRecover,
  findById,
};
