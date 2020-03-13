const { TransactionController } = require('../controllers');

module.exports = {
  registerRecover: {
    action: TransactionController.registerRecover,
    secure: true,
  },
};
