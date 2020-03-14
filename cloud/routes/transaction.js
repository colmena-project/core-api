const { TransactionController } = require('../controllers');

module.exports = {
  registerRecover: {
    action: TransactionController.registerRecover,
    secure: true,
  },
  findTransactionById: {
    action: TransactionController.findById,
    secure: true,
  },
};
