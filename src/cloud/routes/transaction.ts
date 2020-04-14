import { TransactionController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  findTransactionById: {
    action: TransactionController.findTransactionById,
    secure: true,
  },
};

export default definitions;
