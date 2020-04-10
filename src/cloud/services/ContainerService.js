/* @flow */
import type { ContainerType, ContainerStatusType, ParseObject, ParseUser } from '../../flow-types';

const { Parse } = global;
const Container = require('../classes/Container');
const { getQueryAuthOptions } = require('../utils');
const { getValueForNextSequence } = require('../utils/db');
const TransactionService = require('./TransactionService');

const findContainerById = async (id: string, user: ParseUser, master: boolean = false): Promise<ParseObject> => {
  try {
    const authOptions = getQueryAuthOptions(user, master);
    const query = new Parse.Query('Container');
    query.include('type');
    const container = await query.get(id, authOptions);
    return container;
  } catch (error) {
    throw new Error(`Container ${id} not found`);
  }
};

const generateContainerCode = (typeCode: string, transactionNumber: string, containerNumber: number): string =>
  `${typeCode}-${transactionNumber}-${containerNumber}`;

const createContainer = async (transactionNumber: string, attributes: ContainerType): Promise<ParseObject> => {
  const { type, status } = attributes;
  const number = await getValueForNextSequence(Container.name);
  const code = generateContainerCode(type.get('code'), transactionNumber, number);
  const container = new Container();
  container.set('status', status);
  container.set('number', number);
  container.set('type', type);
  container.set('code', code);
  return container;
};

const createContainersOfType = async (
  type: ParseObject,
  qty: number,
  status: ContainerStatusType,
  transactionNumber: string,
): Promise<ParseObject[]> => {
  const promises = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qty; i++) {
    promises.push(createContainer(transactionNumber, { type, status }));
  }
  return Promise.all(promises);
};

const findContainersByTransaction = async (transaction: ParseObject): Promise<ParseObject[]> => {
  const query = new Parse.Query('TransactionDetail');
  query.select('container');
  query.include('container.type');
  query.equalTo('transaction', transaction);
  const transactionsDetails = await query.find({ useMasterKey: true });
  return transactionsDetails.map((detail) => detail.get('container'));
};

const findContainersByUser = async (user: ParseUser, master: boolean = false): Promise<ParseObject[]> => {
  const authOptions = getQueryAuthOptions(user, master);
  const query = new Parse.Query('Container');
  const containers = await query.find(authOptions);
  return containers;
};

const isRecyclerOfContainer = async (container: ParseObject, user: ParseUser): Promise<boolean> => {
  const transaction = await TransactionService.findRecoverTransactionOfContainer(container);
  if (!transaction) return false;
  return transaction.get('to').equals(user);
};

const isCarrierOfContainer = async (container: ParseObject, user: ParseUser): Promise<boolean> => {
  const transaction = await TransactionService.findTransferAcceptTransactionOfContainer(container);
  if (!transaction) return false;
  return transaction.get('to').equals(user);
};

module.exports = {
  createContainer,
  findContainerById,
  findContainersByUser,
  findContainersByTransaction,
  createContainersOfType,
  isRecyclerOfContainer,
  isCarrierOfContainer,
};
