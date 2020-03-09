const { AccountController } = require('../controllers');

module.exports = {
  createAccount: {
    action: AccountController.createAccount,
    secure: true,
  },
  getMyAccount: {
    action: AccountController.getMyAccount,
    secure: true,
  },
  getAccountOf: {
    action: AccountController.getAccountOf,
    secure: true,
  },
};
