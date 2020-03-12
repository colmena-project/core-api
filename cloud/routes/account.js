const { AccountController } = require('../controllers');

module.exports = {
  createAccount: {
    action: AccountController.createAccount,
    secure: false,
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
