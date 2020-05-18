import { AccountService, StockService, ContainerService } from '../services';

const createAccount = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params } = request;
  return AccountService.createAccount(<Colmena.AccountType>params);
};

const getMyAccount = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object.ToJSON<Parse.Attributes>> => {
  const { user } = request;
  const account = await AccountService.findAccountByUser(user);
  const [addresses, stock, containers] = await Promise.all([
    AccountService.findAccountAddress(account),
    StockService.getUserStock(user),
    ContainerService.findAllowedContainers(user),
  ]);
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

const getAccountOf = async (request: Colmena.SecureFunctionRequest): Promise<Object> => {
  const { params } = request;
  const { accountId } = params;
  return AccountService.findAccountById(accountId);
};

const addNewAddress = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params, user } = request;
  return AccountService.addNewAddress(<Colmena.AddressType>params, user);
};

const editAddress = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params, user } = request;
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
