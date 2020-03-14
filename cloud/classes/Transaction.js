// const { Parse } = global;
const Base = require('./Base');
// const { getQueryAuthOptions } = require('../utils');

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
}

module.exports = Transaction;
