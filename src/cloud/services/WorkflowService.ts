/* eslint-disable function-paren-newline */
import TransactionService from './TransactionService';
import AccountService from './AccountService';
import ContainerService from './ContainerService';
import NotificationService from './NotificationService';
import RecyclingCenterService from './RecyclingCenterService';
import SecurityService from './SecurityService';
import StockService from './StockService';
import UserService from './UserService';
import WasteTypeService from './WasteTypeService';
import RetributionService from './RetributionService';
import MapService from './MapService';
import { getValueForNextSequence } from '../utils/db';

import {
  CONTAINER_STATUS,
  MAX_CONTAINERS_QUANTITY_PER_REQUEST,
  PAYMENT_TRANSACTION_STATUS_TYPES,
  RETRIBUTION_TYPES,
  TRACKING_CODE_SEQUENCE,
  TRANSACTIONS_TYPES,
} from '../constants';
import PaymentTransactionService from './PaymentTransactionService';
import { decrypt } from '../utils/cryptography';
import { getBalance, transferPayment } from './WalletServices';

const validateRegisterRecover = (containers: Colmena.ContainerInputType[], addressId: string) => {
  if (!containers) throw new Error('containers is required');
  if (!addressId) throw new Error('addressId is required');
  if (!Array.isArray(containers)) throw new Error('container should be an array');
  const typesMap: Map<string, string> = new Map();
  containers.forEach(({ typeId, qty }) => {
    if (typesMap.has(typeId)) {
      throw new Error(`Waste Type ${typeId} cannot be duplicated on request.`);
    }
    typesMap.set(typeId, typeId);
    if (qty > MAX_CONTAINERS_QUANTITY_PER_REQUEST) {
      throw new Error(
        `Max container quantity per request exceded. Please check your containers data.
        Current max: ${MAX_CONTAINERS_QUANTITY_PER_REQUEST}`,
      );
    }
  });
};

const validateTransferAcceptRejectRequest = (
  transferRequestTransaction: Parse.Object,
  user: Parse.User,
): void => {
  const transactionId: string = transferRequestTransaction.id;
  if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSFER_REQUEST) {
    throw new Error(
      `Transaction ${transactionId} is not in ${TRANSACTIONS_TYPES.TRANSFER_REQUEST} status.`,
    );
  }
  if (transferRequestTransaction.get('expiredAt')) {
    throw new Error(
      `Transaction ${transactionId} expired at ${transferRequestTransaction.get('expiredAt')}.`,
    );
  }
  if (!transferRequestTransaction.get('to').equals(user)) {
    throw new Error('You are not allowed to accept/reject this request.');
  }
};

const validateTransferCancel = (
  transferRequestTransaction: Parse.Object,
  user: Parse.User,
): void => {
  const transactionId: string = transferRequestTransaction.id;
  if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSFER_REQUEST) {
    throw new Error(
      `Transaction ${transactionId} is not in ${TRANSACTIONS_TYPES.TRANSFER_REQUEST} status.`,
    );
  }
  if (transferRequestTransaction.get('expiredAt')) {
    throw new Error(
      `Transaction ${transactionId} expired at ${transferRequestTransaction.get('expiredAt')}.`,
    );
  }
  if (!transferRequestTransaction.get('from').equals(user)) {
    throw new Error('You are not allowed to cancel this request.');
  }
};

const validateTransportCancel = (
  transportRequestTransaction: Parse.Object,
  user: Parse.User,
): void => {
  const transactionId: string = transportRequestTransaction.id;
  if (transportRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSPORT) {
    throw new Error(
      `Transaction ${transactionId} is not in ${TRANSACTIONS_TYPES.TRANSPORT} status.`,
    );
  }
  if (transportRequestTransaction.get('expiredAt')) {
    throw new Error(
      `Transaction ${transactionId} expired at ${transportRequestTransaction.get('expiredAt')}.`,
    );
  }
  if (!transportRequestTransaction.get('from').equals(user)) {
    throw new Error('You are not allowed to cancel this request.');
  }
};

const canTransportContainer = async (
  container: Parse.Object,
  user: Parse.User,
): Promise<boolean> => {
  const [isRecycler, isCarrier]: boolean[] = await Promise.all([
    ContainerService.isRecyclerOfContainer(container, user),
    ContainerService.isCarrierOfContainer(container, user),
  ]);
  if (
    !(isRecycler || isCarrier) ||
    // if is container recycler but container is now transferred to another user.
    (isRecycler && container.get('status') === CONTAINER_STATUS.TRANSFERRED)
  ) {
    throw new Error(
      `Cannot transport container ${container.id}. Please check our security policies.`,
    );
  }
  return true;
};

const validateTransport = async (
  containers: Parse.Object[],
  user: Parse.User,
): Promise<boolean[]> => {
  if (
    // eslint-disable-next-line arrow-body-style
    !containers.every((container) => {
      return [CONTAINER_STATUS.RECOVERED, CONTAINER_STATUS.TRANSFERRED].includes(
        container.get('status'),
      );
    })
  ) {
    throw new Error(
      `Check containers status. To transport a container, It's has to be in 
      ${CONTAINER_STATUS.RECOVERED} or ${CONTAINER_STATUS.TRANSFERRED} status`,
    );
  }

  return Promise.all(containers.map((container) => canTransportContainer(container, user)));
};

const validateDeleteContainers = (containers: Parse.Object[]): any => {
  if (!containers.every((container) => CONTAINER_STATUS.RECOVERED === container.get('status'))) {
    throw new Error(
      `Check containers status. To delete a container, It's has to be in 
    ${CONTAINER_STATUS.RECOVERED} status`,
    );
  }
};

const validateRecyclingCenter = async (transaction: Parse.Object, user: Parse.User) => {
  const recyclingCenterTransaction: Parse.Object | undefined = await transaction.get(
    'recyclingCenter',
  );
  if (!recyclingCenterTransaction) {
    throw new Error('The Recycling Centers is not set in the transaction');
  }

  const userHasRecyclingCenter: boolean = await UserService.checkUserHasRecyclingCenter(
    recyclingCenterTransaction,
    user,
  );

  if (!userHasRecyclingCenter) {
    throw new Error("The Recycling Centers does no match with the user's Recycling Centers");
  }
};

/**
 * Register RECOVER method.
 * Inital point start of colmena recover proccess. It takes an input, wich contains
 * waste type and quantity of containers. It will create a transaction, many transaction details
 * and many container in RECOVERED status for each input.
 *
 * @param {Array} containersInput
 * @param {User} user
 */
const registerRecover = async (
  containersInput: Colmena.ContainerInputType[] = [],
  addressId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    validateRegisterRecover(containersInput, addressId);
    const wasteTypes: Map<string, Parse.Object> = await WasteTypeService.getWasteTypesFromIds(
      containersInput.map((c) => c.typeId),
    );
    const address: Parse.Object = await AccountService.findAccountAddressById(addressId);
    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: undefined,
      to: user,
      type: TRANSACTIONS_TYPES.RECOVER,
      reason: undefined,
      fromAddress: {},
      toAddress: address.toJSON(),
      recyclingCenter: undefined,
      relatedTo: undefined,
    });
    const containersSetArray: Array<Parse.Object[]> = await Promise.all(
      containersInput.map(({ typeId, qty }) => {
        const wasteType: Parse.Object | undefined = wasteTypes.get(typeId);
        if (!wasteType) throw new Error('Waste Type not found');
        return ContainerService.createContainersOfType(
          wasteType,
          qty,
          CONTAINER_STATUS.RECOVERED,
          transaction.get('number'),
        );
      }),
    );
    // TODO replace this line by new array flat() method.
    const containers: Parse.Object[] = ([] as Parse.Object[]).concat(...containersSetArray);
    const details: Parse.Object[] = containers.map((container) =>
      TransactionService.createTransactionDetail(transaction, container),
    );

    await Parse.Object.saveAll([transaction, ...containers, ...details], {
      sessionToken: user.getSessionToken(),
    });

    await Promise.all(
      containersInput.map((input) => {
        const wasteType: Parse.Object | undefined = wasteTypes.get(input.typeId);
        if (!wasteType) throw new Error('Waste Type not found');
        return StockService.incrementStock(wasteType, user, input.qty);
      }),
    );

    const retribution = await RetributionService.generateRetribution(transaction, user);
    transaction.set('retribution', retribution.toJSON());

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Delete a et of user containers.
 *
 * @param containersInput containers ids to delete
 * @param user User who request the endpoint.
 */
const deleteContainers = async (containersInput: string[], user: Parse.User): Promise<any> => {
  try {
    const containers = await new Parse.Query('Container')
      .include('type')
      .containedIn('objectId', containersInput)
      .find({ sessionToken: user.getSessionToken() });

    validateDeleteContainers(containers);
    const address = await AccountService.findAccountByUser(user);
    const transaction = await TransactionService.createTransaction({
      from: undefined,
      to: user,
      type: TRANSACTIONS_TYPES.DELETE_CONTAINERS,
      reason: undefined,
      fromAddress: {},
      toAddress: address.toJSON(),
      recyclingCenter: undefined,
      relatedTo: undefined,
    });

    const details = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.DELETED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...containers, ...details], {
      sessionToken: user.getSessionToken(),
    });

    await Promise.all(
      containers.map((container) => {
        const wasteType = container.get('type');
        if (!wasteType) throw new Error('Waste Type not found');
        return StockService.decrementStock(wasteType, user, 1);
      }),
    );

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Transfer Request method. It accept a container ids array and then generates one Transaction
 * along with many transactions details for each container. Each container status is changed to
 * TRANSFER_PENDING status. No stock movements are generated here.
 *
 * @param {Array} containersInput
 * @param {User} to
 * @param {User} user
 */
const registerTransferRequest = async (
  containersInput: string[],
  to: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    if (!to) throw new Error("Cannot transfer without a recipient. Please check parameter 'to'");
    const recipient: Parse.User = await UserService.findUserById(to);
    const containers: Parse.Object[] = await Promise.all(
      containersInput.map((containerId) => ContainerService.findContainerById(containerId, user)),
    );
    if (!containers.every((container) => container.get('status') === CONTAINER_STATUS.RECOVERED)) {
      throw new Error(
        `Check containers status. To transfer a container to a user 
        It's has to be in ${CONTAINER_STATUS.RECOVERED} status`,
      );
    }
    const userAccount: Parse.Object = await AccountService.findAccountByUser(user);
    const recipientAccount: Parse.Object = await AccountService.findAccountByUser(recipient);

    const [fromAddress, toAddress]: Parse.Object[] = await Promise.all([
      AccountService.findDefaultAddress(userAccount),
      AccountService.findDefaultAddress(recipientAccount),
    ]);

    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: user,
      to: recipient,
      type: TRANSACTIONS_TYPES.TRANSFER_REQUEST,
      fromAddress: fromAddress.toJSON(),
      toAddress: toAddress.toJSON(),
      reason: undefined,
      recyclingCenter: undefined,
      relatedTo: undefined,
    });

    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.TRANSFER_PENDING);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    await SecurityService.grantReadAndWritePermissionsToUser(
      'Transaction',
      transaction.id,
      recipient,
    );
    await Promise.all(
      containers.map((container) =>
        SecurityService.grantReadAndWritePermissionsToUser('Container', container.id, recipient),
      ),
    );
    await NotificationService.notifyTransferRequest(transaction.id, user, recipient);
    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Transfer Accept method. Receive the Transaction Id for a TRASNFER_REQUEST given.
 * Verifies if transaction is valid and then creates a new Transaction and detail for the operation.
 * Each container in the request is set to TRANSFERRED status. Also, move the stock from the owner
 * to the user that request the endpoint.
 *
 * @param {Array} transactionId
 * @param {User} user
 */
const registerTransferAccept = async (
  transactionId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const transferRequestTransaction: Parse.Object = await TransactionService.findRawTransaction(
      transactionId,
      user,
    );
    const from = transferRequestTransaction.get('from');
    const to = transferRequestTransaction.get('to');
    validateTransferAcceptRejectRequest(transferRequestTransaction, user);
    const transaction: Parse.Object = await TransactionService.createTransaction({
      from,
      to,
      type: TRANSACTIONS_TYPES.TRANSFER_ACCEPT,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
      reason: undefined,
      recyclingCenter: undefined,
    });
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );
    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.TRANSFERRED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });
    await Promise.all(
      containers.map((container) => StockService.moveStock(container.get('type'), from, to, 1)),
    );

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransferReject = async (
  transactionId: string,
  reason: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const transferRequestTransaction: Parse.Object = await TransactionService.findRawTransaction(
      transactionId,
      user,
    );
    validateTransferAcceptRejectRequest(transferRequestTransaction, user);

    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transferRequestTransaction.get('from'),
      to: transferRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.TRANSFER_REJECT,
      reason,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
      recyclingCenter: undefined,
    });
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );
    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.RECOVERED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransferCancel = async (
  transactionId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const transferRequestTransaction: Parse.Object = await TransactionService.findRawTransaction(
      transactionId,
      user,
    );
    validateTransferCancel(transferRequestTransaction, user);
    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transferRequestTransaction.get('from'),
      to: transferRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.TRANSFER_CANCEL,
      reason: undefined,
      recyclingCenter: undefined,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
    });
    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );

    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.RECOVERED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    await Promise.all(
      containers.map((container) =>
        SecurityService.revokeReadAndWritePermissionsToUser(
          'Container',
          container.id,
          transferRequestTransaction.get('to'),
        ),
      ),
    );
    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

/**
 * Register Transport. Receive an array of containers ids.
 * Verifies if containers are in RECOVERED or TRANSFERRED status and then check if the user can transport it.
 * Creates one transaction, many details for each container and changes containers status to IN_TRANSIT with the reciclen center Role.
 * Then notifies to all the user involved except the user that request the endpoint.
 * A tracking code is generated for the transport to the recycling center.
 *
 * @param {Array} containersInput
 * @param {User} to
 * @param {User} user
 */
const registerTransport = async (
  containersInput: string[],
  to: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    if (!to) throw new Error("Cannot transfer without a destination. Please check parameter 'to'");
    const recyclingCenter: Parse.Object = await RecyclingCenterService.findRecyclingCenterById(to);
    const containers: Parse.Object[] = await Promise.all(
      containersInput.map((containerId) => ContainerService.findContainerById(containerId, user)),
    );

    await validateTransport(containers, user);

    const userAccount = await AccountService.findAccountByUser(user);
    const fromAddress: Parse.Object = await AccountService.findDefaultAddress(userAccount);
    const toAddress = {
      latLng: recyclingCenter.get('latLng').toJSON(),
    };

    const fromLatLng = {
      latitude: fromAddress.get('latLng').latitude,
      longitude: fromAddress.get('latLng').longitude,
    };
    const toLatLng = { latitude: toAddress.latLng.latitude, longitude: toAddress.latLng.longitude };
    const distanceResult = await MapService.distancematrix(fromLatLng, toLatLng);

    const distanceMatrix = distanceResult.distance[0].elements[0];

    const trackingCode = await getValueForNextSequence(TRACKING_CODE_SEQUENCE);

    const transaction: Parse.Object = await TransactionService.createTransaction({
      to: undefined,
      from: user,
      type: TRANSACTIONS_TYPES.TRANSPORT,
      recyclingCenter,
      reason: undefined,
      fromAddress: fromAddress.toJSON(),
      toAddress,
      relatedTo: undefined,
      kms: distanceMatrix.distance.value / 1000,
      estimatedDuration: distanceMatrix.duration,
      estimatedDistance: distanceMatrix.distance,
      trackingCode,
    });

    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.IN_TRANSIT);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    const retribution = await RetributionService.generateRetribution(transaction, user);
    transaction.set('retribution', retribution.toJSON());

    await TransactionService.addRoleFactoryToTransacction(recyclingCenter, transaction, details);

    // get containers owners except user that request the endpoint
    const usersList: Parse.User[] = containers
      .map((c) => c.get('createdBy'))
      .filter((u) => !u.equals(user));
    await NotificationService.notifyTransport(transaction.id, user, usersList);
    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be registered. Detail: ${error.message}`);
  }
};

const registerTransportCancel = async (
  transactionId: string,
  reason: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const transportRequestTransaction = await TransactionService.findRawTransaction(
      transactionId,
      user,
    );
    validateTransportCancel(transportRequestTransaction, user);
    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transportRequestTransaction.get('from'),
      to: transportRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.TRANSPORT_CANCEL,
      reason,
      recyclingCenter: transportRequestTransaction.get('recyclingCenter'),
      fromAddress: transportRequestTransaction.get('fromAddress'),
      toAddress: transportRequestTransaction.get('toAddress'),
      relatedTo: undefined,
    });

    transaction.set('relatedTo', transportRequestTransaction);
    transportRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transportRequestTransaction,
    );

    const details: Parse.Object[] = containers.map((container) => {
      if (container.get('createdBy').id === user.id) {
        container.set('status', CONTAINER_STATUS.RECOVERED);
      } else {
        container.set('status', CONTAINER_STATUS.TRANSFERRED);
      }
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );
    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be canceled. Detail: ${error.message}`);
  }
};

/**
 * Creates the accept transaction from the TRANSPORT in the Recycling Centers
 *
 * Verify if the transaction is type Transport and is asing to a recycling center.
 * Check if the user and the transaction is the the same recycling center.
 *
 * Create a new Transaccion and Transaction details with the same information and change the type.
 * The type for transaccion is TRANSPORT_ACCEPT and container status is IN_PROCESS.
 *
 * Then, the transaction recive is link to the new transaction (making a linkedList) and is mark as expired
 *
 * @param {*} transaction
 * @param {*} user
 */
const registerTransportAccept = async (
  transactionId: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const Transaction: string = Parse.Object.extend('Transaction');
    const queryRecyclingCenters: Parse.Query = new Parse.Query(Transaction);
    const transferRequestTransaction: Parse.Object = await queryRecyclingCenters.get(
      transactionId,
      {
        useMasterKey: true,
      },
    );

    if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSPORT) {
      throw new Error('The transactions is not allow to be Accept in the Recycling Center');
    }

    const recyclingCenter: Parse.Object = transferRequestTransaction.get('recyclingCenter');

    await validateRecyclingCenter(transferRequestTransaction, user);

    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transferRequestTransaction.get('from'),
      to: transferRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.TRANSPORT_ACCEPT,
      reason: undefined,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
      recyclingCenter: transferRequestTransaction.get('recyclingCenter'),
      trackingCode: transferRequestTransaction.get('trackingCode'),
      kms: transferRequestTransaction.get('kms'),
      estimatedDuration: transferRequestTransaction.get('estimatedDuration'),
      estimatedDistance: transferRequestTransaction.get('estimatedDistance'),
    });

    transaction.set('relatedTo', transferRequestTransaction);
    transferRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );

    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.IN_PROCESS);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, transferRequestTransaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    await TransactionService.addRoleFactoryToTransacction(recyclingCenter, transaction, details);

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );

    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be Accept. Detail: ${error.message}`);
  }
};

/**
 * Creates the Reject transaction from the TRANSPORT in the Recycling Centers
 *
 * Verify if the transaction is type Transport and is asing to a recycling center.
 * Check if the user and the transaction is the the same recycling center.
 *
 * Create a new Transaccion and Transaction details with the same information and change the type.
 * The type for transaccion is TRANSPORT_REJECT and container status is TRANSFER_REJECTED.
 *
 * Then, the transaction recive is link to the new transaction (making a linkedList) and is mark as expired
 *
 * TODO is missing the process to recover the reject transaction by the User.
 *
 * @param {*} transaction
 * @param {*} user
 */
const registerTransportReject = async (
  transactionId: string,
  reason: string,
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const Transaction: string = Parse.Object.extend('Transaction');
    const queryRecyclingCenters: Parse.Query = new Parse.Query(Transaction);
    const transferRequestTransaction: Parse.Object = await queryRecyclingCenters.get(
      transactionId,
      {
        useMasterKey: true,
      },
    );

    if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSPORT) {
      throw new Error('The transactions is not allow to be Accept in the Recycling Center');
    }

    await validateRecyclingCenter(transferRequestTransaction, user);

    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transferRequestTransaction.get('from'),
      to: transferRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.TRANSPORT_REJECT,
      reason,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
      recyclingCenter: transferRequestTransaction.get('recyclingCenter'),
      trackingCode: transferRequestTransaction.get('trackingCode'),
      kms: transferRequestTransaction.get('kms'),
      estimatedDuration: transferRequestTransaction.get('estimatedDuration'),
      estimatedDistance: transferRequestTransaction.get('estimatedDistance'),
    });
    transferRequestTransaction.set('relatedTo', transaction);
    transferRequestTransaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );

    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.TRANSFER_REJECTED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    await Parse.Object.saveAll([transaction, transferRequestTransaction, ...details], {
      sessionToken: user.getSessionToken(),
    });

    // TODO is missing the process to recover the reject transaction by the User.

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );

    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be Accept. Detail: ${error.message}`);
  }
};

/**
 * Check if the recicling center has the balance to pay the transaction
 * @param containersPayment
 * @param recyclingCenter
 * @param user
 */
const throwInsufficientBalance = async ({
  containersPayment,
  recyclingCenter,
  user,
}: {
  containersPayment: { container: string; total: number; payment: number }[];
  recyclingCenter: Parse.Object;
  user: Parse.User;
}): Promise<void> => {
  const totalPayment = containersPayment
    .map((item) => item.payment)
    .reduce((partialSum, a) => partialSum + a, 0);

  // Find the containers by the code
  const retributionUpdate = await Promise.all(
    containersPayment.map((element) =>
      ContainerService.findContainerByCode({
        code: element.container,
      }),
    ),
  );

  // find all the transaction where the containers are used
  const historyWithTransaction = await Promise.all(
    retributionUpdate.map(
      (element) =>
        element &&
        TransactionService.generateHistoryTransactionFromContainer([element.id], user, true).then(
          (hTransaction) => ({
            containerId: element.id,
            containerName: element.get('code'),
            history: hTransaction,
          }),
        ),
    ),
  );

  // find tranports transaction from the history
  const transactionTransport = historyWithTransaction.map(
    (transaction) =>
      transaction &&
      transaction.history.filter((element) => element.type === TRANSACTIONS_TYPES.TRANSPORT),
  );

  let ammountTransport = 0;
  transactionTransport.forEach((transaction) => {
    if (transaction) {
      transaction.forEach((historyTransaction) => {
        ammountTransport += historyTransaction.retribution.estimated;
      });
    }
  });

  // Check the balance of the recycling center
  const { balance } = await getBalance(recyclingCenter.get('walletId'));
  if (balance <= totalPayment + ammountTransport) {
    throw new Error('insufficient funds');
  }
};

const executePayment = async ({
  retributionId,
  recyclingCenter,
  motive,
}: {
  retributionId: string;
  recyclingCenter: Parse.Object;
  motive: string;
}): Promise<void> => {
  const query = new Parse.Query('Retribution');
  const retribution: Parse.Object | undefined = await query.get(retributionId, {
    useMasterKey: true,
  });
  if (retribution) {
    const amout = retribution.get('confirmed');
    const userClient = retribution.get('user');
    const accountClient = await AccountService.findAccountByUser(userClient);

    const walletId = recyclingCenter.get('walletId');
    const walletToken = recyclingCenter.get('walletToken');
    const walleKey = decrypt(walletToken);
    await transferPayment({
      accountFrom: walletId,
      accountTo: accountClient.get('walletId'),
      amount: amout,
      motive,
      privkey: walleKey,
    });
  }
};

/**
 * Generate the payment for a container.
 * First is search the container and generate the payment transaction.
 * Then search the history of the container, with his history search the recovery and transport transaction,
 * Afer find this, is update the retribution, with the amount of payment with con confirm transaction,
 * generate the payment and the status of the container is CONFIRMED.
 *
 * @param transactionConfirm
 * @param container
 * @param user
 * @param recyclingCenter
 */
const registerContainerPayment = async ({
  transactionConfirm,
  container,
  user,
  recyclingCenter,
}: {
  transactionConfirm: Parse.Object;
  container: { container: string; total: number; payment: number };
  user: Parse.User;
  recyclingCenter: Parse.Object;
}): Promise<Parse.Object | undefined> => {
  // Find the container by the code
  const containerObject = await ContainerService.findContainerByCode({ code: container.container });

  if (!containerObject) {
    return undefined;
  }

  // find all the transaction where the container is used
  const historyWithTransaction = await TransactionService.generateHistoryTransactionFromContainer(
    [containerObject.id],
    user,
    true,
  ).then((hTransaction) => ({
    containerId: containerObject.id,
    containerName: containerObject.get('code'),
    history: hTransaction,
  }));

  // find recovery transaction
  const transactionRecovery = historyWithTransaction.history.filter(
    (element) => element.type === TRANSACTIONS_TYPES.RECOVER,
  );

  // Update Retribution
  await Promise.all(
    transactionRecovery.map((contRecovey) =>
      RetributionService.updateRetribution(
        contRecovey.retribution.objectId,
        transactionConfirm,
        container.total,
      ),
    ),
  );

  // Sent Crypto to wallets for recovery
  await Promise.all(
    transactionRecovery.map((contRecovey) => {
      const wasteType = containerObject.get('type');
      return executePayment({
        retributionId: contRecovey.retribution.objectId,
        recyclingCenter,
        motive: `${RETRIBUTION_TYPES.MATERIAL} - ${
          contRecovey.retribution.confirmed
        } ${wasteType.get('name')}`,
      });
    }),
  );

  // Register Payment Recovery
  const paymentTransaction = await PaymentTransactionService.createPaymentTransaction({
    type: RETRIBUTION_TYPES.MATERIAL,
    status: PAYMENT_TRANSACTION_STATUS_TYPES.PAID,
    transaction: transactionConfirm,
    amount: container.payment,
    container: containerObject,
  });

  await paymentTransaction.save(null, {
    sessionToken: user.getSessionToken(),
  });

  // find tranport transaction
  const transactionTransport = historyWithTransaction.history.filter(
    (element) => element.type === TRANSACTIONS_TYPES.TRANSPORT,
  );

  // Update Retribution Trasport
  const retributionUpdate = await Promise.all(
    transactionTransport.map((contTransport) =>
      RetributionService.updateRetribution(
        contTransport.retribution.objectId,
        transactionConfirm,
        contTransport.retribution.estimated,
      ),
    ),
  );

  // Sent Crypto to wallets for transportation
  await Promise.all(
    transactionTransport.map((contTransport) =>
      executePayment({
        retributionId: contTransport.retribution.objectId,
        recyclingCenter,
        motive: `${RETRIBUTION_TYPES.TRANSPORT}  - ${contTransport.retribution.confirmed}`,
      }),
    ),
  );

  let paymentTransport = 0;
  retributionUpdate.forEach((ret) => {
    paymentTransport += ret.get('confirmed');
  });

  // Register Payment Transport
  const paymentTransactionTransport = await PaymentTransactionService.createPaymentTransaction({
    type: RETRIBUTION_TYPES.TRANSPORT,
    status: PAYMENT_TRANSACTION_STATUS_TYPES.PAID,
    transaction: transactionConfirm,
    amount: paymentTransport,
    container: containerObject,
  });

  await paymentTransactionTransport.save(null, {
    sessionToken: user.getSessionToken(),
  });

  return paymentTransaction;
};

/**
 * Process to register the payment of the containter in a transaction.
 * First is create a new transaction wit the status COMPLETE.
 * Then change the status COMPLETED in the contaier/s
 *
 * @param transactionId
 * @param paymentTransaction
 * @param user
 */
const registerPayment = async (
  transactionId: string,
  containersPayment: { container: string; total: number; payment: number }[],
  user: Parse.User,
): Promise<Parse.Object> => {
  try {
    const Transaction: string = Parse.Object.extend('Transaction');
    const queryRecyclingCenters: Parse.Query = new Parse.Query(Transaction);
    const transferRequestTransaction: Parse.Object = await queryRecyclingCenters.get(
      transactionId,
      {
        useMasterKey: true,
      },
    );

    if (transferRequestTransaction.get('type') !== TRANSACTIONS_TYPES.TRANSPORT_ACCEPT) {
      throw new Error('The transactions is not allow to be Accept in the Recycling Center');
    }
    await validateRecyclingCenter(transferRequestTransaction, user);

    const recyclingCenter = transferRequestTransaction.get('recyclingCenter');

    // Fill the object
    await recyclingCenter.fetch();

    // register a new transaction
    const reason = 'se Registra el Pago';
    const transaction: Parse.Object = await TransactionService.createTransaction({
      from: transferRequestTransaction.get('from'),
      to: transferRequestTransaction.get('to'),
      type: TRANSACTIONS_TYPES.COMPLETE,
      reason,
      fromAddress: transferRequestTransaction.get('fromAddress'),
      toAddress: transferRequestTransaction.get('toAddress'),
      relatedTo: undefined,
      recyclingCenter,
      trackingCode: transferRequestTransaction.get('trackingCode'),
      kms: transferRequestTransaction.get('kms'),
      estimatedDuration: transferRequestTransaction.get('estimatedDuration'),
      estimatedDistance: transferRequestTransaction.get('estimatedDistance'),
    });

    transaction.set('relatedTo', transferRequestTransaction);
    transaction.set('expiredAt', new Date());

    const containers: Parse.Object[] = await ContainerService.findContainersByTransaction(
      transferRequestTransaction,
    );

    // Update the container status
    const details: Parse.Object[] = containers.map((container) => {
      container.set('status', CONTAINER_STATUS.COMPLETED);
      return TransactionService.createTransactionDetail(transaction, container);
    });

    // Check if the factory has balance to pay
    await throwInsufficientBalance({
      containersPayment,
      recyclingCenter,
      user,
    });

    await Parse.Object.saveAll(
      [transaction, transferRequestTransaction, ...details, ...containers],
      {
        sessionToken: user.getSessionToken(),
      },
    );

    // Register Payment on the container
    await Promise.all(
      containersPayment.map((container) =>
        registerContainerPayment({
          transactionConfirm: transaction,
          container,
          user,
          recyclingCenter,
        }),
      ),
    );

    transaction.set(
      'details',
      details.map((d) => d.toJSON()),
    );

    return transaction;
  } catch (error) {
    throw new Error(`Transaction could not be Accept. Detail: ${error.message}`);
  }
};

export default {
  registerRecover,
  registerTransferRequest,
  registerTransferAccept,
  registerTransferReject,
  registerTransferCancel,
  registerTransport,
  registerTransportCancel,
  registerTransportAccept,
  registerTransportReject,
  registerPayment,
  registerContainerPayment,
  deleteContainers,
};
