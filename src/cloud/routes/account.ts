import { Colmena } from '../../types';
import { AccountController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  createAccount: {
    action: AccountController.createAccount,
    secure: false,
  },
  getMyAccount: {
    action: AccountController.getMyAccount,
    secure: true,
  },
  getAccountOf: {
    action: AccountController.getAccountOf,
    secure: true,
  },
  addNewAddress: {
    action: AccountController.addNewAddress,
    secure: true,
  },
  editAddress: {
    action: AccountController.editAddress,
    secure: true,
  },
};

export default definitions;
