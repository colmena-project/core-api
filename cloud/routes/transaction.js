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
  registerTransferAccept: {
    action: TransactionController.registerTransferAccept,
    secure: true,
  },
  registerTransferReject: {
    action: TransactionController.registerTransferReject,
    secure: true,
  },
  findTransactionById: {
    action: TransactionController.findTransactionById,
    secure: true,
  },
};
