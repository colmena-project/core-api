import Base from './Base';

import { TRANSACTIONS_TYPES } from '../constants';

class Transaction extends Base {
  constructor() {
    super(Transaction.name);
  }

  // static async afterFind(request) {
  //   const { objects: transactions, user, master } = request;
  //   const authOptions = getQueryAuthOptions(user, master);

  //   const detailPromisses = transactions.map((transaction) => {
  //     const detailQuery = new Parse.Query('TransactionDetail');
  //     detailQuery.equalTo('transaction', transaction);
  //     detailQuery.include('container');
  //     return detailQuery.find(authOptions);
  //   });

  //   const transactionDetails = await Promise.all(detailPromisses);

  //   transactions.forEach((t, index) => {
  //     const details = transactionDetails[index];
  //     t.set(
  //       'details',
  //       details.map((d) => d.toJSON()),
  //     );
  //     return t;
  //   });

  //   return transactions;
  // }
  static async afterDelete(request: Parse.Cloud.AfterDeleteRequest): Promise<any> {
    const { object: transaction } = request;
    const detailsQuery = new Parse.Query('TransactionDetail');
    detailsQuery.equalTo('transaction', transaction.toPointer());
    const details = await detailsQuery.find({ useMasterKey: true });
    details.forEach((d) => {
      if (transaction.get('type') === TRANSACTIONS_TYPES.RECOVER) {
        const container = d.get('container');
        container.destroy({ useMasterKey: true });
      }
      d.destroy({ useMasterKey: true });
    });
  }
}

export default Transaction;
