/* @flow */
import type { ParseObject } from '../../flow-types';

const { AccountService, StockService, ContainerService } = require('../services');

const createAccount = async (request: Object): Promise<ParseObject> => {
  const { params } = request;
  return AccountService.createAccount(params);
};

const getMyAccount = async (request: Object): Promise<Object> => {
  const { user } = request;
  const account = await AccountService.findAccountByUser(user);
  const addresses = await AccountService.findAccountAddress(user);
  const stock = await StockService.getUserStock(user);
  const containers = await ContainerService.findContainersByUser(user);

  account.set(
    'addresses',
    addresses.map((a) => a.toJSON()),
  );
  account.set(
    'containers',
    containers.map((c) => c.toJSON()),
  );
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

const getAccountOf = async (request: Object): Promise<Object> => {
  const { params, user } = request;
  const { accountId } = params;
  return AccountService.findAccountById(accountId, user);
};

const addNewAddress = async (request: Object): Promise<ParseObject> => {
  const { params, user } = request;
  return AccountService.addNewAddress(params, user);
};

const editAddress = async (request: Object): Promise<ParseObject> => {
  const { params, user } = request;
  const { addressId, attributes } = params;
  return AccountService.editAddress(addressId, attributes, user);
};

module.exports = {
  createAccount,
  getMyAccount,
  getAccountOf,
  addNewAddress,
  editAddress,
};
