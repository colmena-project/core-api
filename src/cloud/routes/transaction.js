const { TransactionController } = require('../controllers');

module.exports = {
  findTransactionById: {
    action: TransactionController.findTransactionById,
    secure: true,
  },
};
