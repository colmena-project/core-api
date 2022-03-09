import { Container } from '../classes';
import { getQueryAuthOptions } from '../utils';
import { getValueForNextSequence } from '../utils/db';
import TransactionService from './TransactionService';

const findContainerById = async (
  id: string,
  user: Parse.User,
  master: boolean = false,
): Promise<Parse.Object> => {
  try {
    const authOptions = getQueryAuthOptions(user, master);
    const query: Parse.Query = new Parse.Query('Container');
    query.include('type');
    const container: Parse.Object = await query.get(id, authOptions);
    return container;
  } catch (error) {
    throw new Error(`Container ${id} not found`);
  }
};

const generateContainerCode = (
  typeCode: string,
  transactionNumber: string,
  containerNumber: number,
): string => `${typeCode}-${transactionNumber}-${containerNumber}`;

const createContainer = async (
  transactionNumber: string,
  attributes: Colmena.ContainerType,
): Promise<Parse.Object> => {
  const { type, status } = attributes;
  const number: number = await getValueForNextSequence(Container.name);
  const code: string = generateContainerCode(type.get('code'), transactionNumber, number);
  const container: Container = new Container();
  container.set('status', status);
  container.set('number', number);
  container.set('type', type);
  container.set('code', code);
  return container;
};

const createContainersOfType = async (
  type: Parse.Object,
  qty: number,
  status: Colmena.ContainerStatusType,
  transactionNumber: string,
): Promise<Parse.Object[]> => {
  const promises: Promise<Parse.Object>[] = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qty; i++) {
    promises.push(createContainer(transactionNumber, { type, status }));
  }
  return Promise.all(promises);
};

const findContainersByTransaction = async (transaction: Parse.Object): Promise<Parse.Object[]> => {
  const query: Parse.Query = new Parse.Query('TransactionDetail');
  query.select('container');
  query.include('container.type');
  query.include('createdBy');
  query.equalTo('transaction', transaction);
  const transactionsDetails: Parse.Object[] = await query.find({ useMasterKey: true });
  return transactionsDetails.map((detail) => detail.get('container'));
};

const findAllowedContainers = async (
  user: Parse.User,
  master: boolean = false,
): Promise<Parse.Object[]> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, master);
  const query: Parse.Query = new Parse.Query('Container');
  const containers: Parse.Object[] = await query.find(authOptions);
  return containers;
};

const findContainerByCode = async ({
  code,
}: {
  code: string;
}): Promise<Parse.Object | undefined> => {
  const detailQuery: Parse.Query = new Parse.Query(Parse.Object.extend('Container'));
  detailQuery.equalTo('code', code);
  const containerObject: Parse.Object | undefined = await detailQuery.first({ useMasterKey: true });
  return containerObject;
};

const isRecyclerOfContainer = async (
  container: Parse.Object,
  user: Parse.User,
): Promise<boolean> => {
  const transaction = await TransactionService.findRecoverTransactionOfContainer(container);
  if (!transaction) return false;
  return transaction.get('to').equals(user);
};

const isCarrierOfContainer = async (
  container: Parse.Object,
  user: Parse.User,
): Promise<boolean> => {
  const transaction = await TransactionService.findTransferAcceptTransactionOfContainer(container);
  if (!transaction) return false;
  return transaction.get('to').equals(user);
};

export default {
  createContainer,
  findContainerById,
  findAllowedContainers,
  findContainersByTransaction,
  findContainerByCode,
  createContainersOfType,
  isRecyclerOfContainer,
  isCarrierOfContainer,
};
