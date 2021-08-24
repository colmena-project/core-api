import { UserController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  findUser: {
    action: UserController.adminFindUser,
    secure: true,
  },
  findUserBy: {
    action: UserController.adminFindUserBy,
    secure: true,
  },

  findUserById: {
    action: UserController.adminFindUserById,
    secure: true,
  },

  createUser: {
    action: UserController.adminCreateUser,
    secure: true,
  },

  udpdateUser: {
    action: UserController.adminUdpdateUser,
    secure: true,
  },
};

export default definitions;
