/* eslint-disable no-unused-vars */
const { Parse } = global;
const { AccountService, StockService } = require('../services');

const createAccount = async (request) => {
  const { params, user } = request;
  return AccountService.createAccount(params, user);
};

const getMyAccount = async (request) => {
  const { user } = request;
  const account = await AccountService.findAccountByUser(user);
  const stock = await StockService.getUserStock(user);
  account.set(
    'stock',
    stock.map((s) => {
      const stockJson = s.toJSON();
      const wasteType = s.get('wasteType').toJSON();
      return { ...stockJson, wasteType };
    }),
  );

  return account.toJSON();
};

const getAccountOf = async (request) => {
  const { params, user } = request;
  const { accountId } = params;
  AccountService.findAccountById(accountId, user);
};

module.exports = {
  createAccount,
  getMyAccount,
  getAccountOf,
};
