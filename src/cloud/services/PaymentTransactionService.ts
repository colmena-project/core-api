import { PaymentTransaction } from '../classes';

const createPaymentTransaction = async (
  attributes: Colmena.PaymentTransactionType,
): Promise<Parse.Object> => {
  const { type, status, transaction, container, amount } = attributes;
  const paymentTransaction: Parse.Object = new PaymentTransaction();

  paymentTransaction.set('type', type);
  paymentTransaction.set('transaction', transaction);
  paymentTransaction.set('container', container);
  paymentTransaction.set('amount', amount);
  paymentTransaction.set('status', status);
  return paymentTransaction;
};

export default {
  createPaymentTransaction,
};
