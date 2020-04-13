import { Colmena } from '../../types';
import { AccountService, StockService, ContainerService } from '../services';

const createAccount = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object> => {
  const { params } = <{ params: Colmena.AccountType }>request;
  return AccountService.createAccount(params);
};

const getMyAccount = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { user } = <{ user: Parse.User }> request;
  const account: Parse.Object = await AccountService.findAccountByUser(user);
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

const getAccountOf = async (request: Parse.Cloud.FunctionRequest): Promise<Object> => {
  const { params } = <{ params: Parse.Cloud.Params, user: Parse.User }> request;
  const { accountId }= params;
  return AccountService.findAccountById(accountId);
};

const addNewAddress = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object> => {
  const { params, user } = <{ params: Colmena.AddressType, user: Parse.User }> request;
  return AccountService.addNewAddress(params, user);
};

const editAddress = async (request: Parse.Cloud.FunctionRequest): Promise<Parse.Object> => {
  const { params, user } = <{ params: Parse.Cloud.Params, user: Parse.User }> request;
  const { addressId, attributes } = params;
  return AccountService.editAddress(addressId, attributes, user);
};

export default {
  createAccount,
  getMyAccount,
  getAccountOf,
  addNewAddress,
  editAddress,
};
