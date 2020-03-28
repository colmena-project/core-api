const { TransactionController } = require('../controllers');

module.exports = {
  registerRecover: {
    action: TransactionController.registerRecover,
    secure: true,
  },
  registerTransferRequest: {
    action: TransactionController.registerTransferRequest,
    secure: true,
  },
  findTransactionById: {
    action: TransactionController.findTransactionById,
    secure: true,
  },
};
