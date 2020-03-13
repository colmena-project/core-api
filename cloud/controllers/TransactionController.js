const { TransactionService } = require('../services');

const registerRecover = async (request) => {
  const { user, params } = request;
  const { bags } = params;
  const transaction = await TransactionService.registerRecover(bags, user);
  return { result: transaction };
};

module.exports = {
  registerRecover,
};
