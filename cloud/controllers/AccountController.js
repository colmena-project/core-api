/* eslint-disable no-unused-vars */
const { Parse } = global;
const { AccountService } = require('../services');

const createAccount = async (request) => {
  const { params, user } = request;
  return AccountService.createAccount(params, user);
};

const getMyAccount = async (request) => {
  const { user } = request;
  const account = await AccountService.findAccountByUser(user);
  return { account };
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
