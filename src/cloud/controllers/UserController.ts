import { UserService } from '../services';

const adminFindUser = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object[]> => {
  const { params, user } = request;
  const { displayLimit, page } = params;
  return UserService.findUser(displayLimit, page, user);
};
const adminFindUserBy = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object[]> => {
  const { params, user } = request;
  const { search, displayLimit, page } = params;
  return UserService.findUserBy({
    findBy: search,
    displayLimit: displayLimit,
    page: page,
    currentUser: user,
  });
};
const adminFindUserById = async (request: Colmena.SecureFunctionRequest): Promise<Parse.User> => {
  const { params } = request;
  const { id } = params;
  return await UserService.findUserById(id);
};
const adminCreateUser = async (request: Colmena.SecureFunctionRequest) => {
  try {
    const { params, user } = request;
    return UserService.createUser(params, user);
  } catch (err) {
    throw new Error(err.message);
  }
};

const adminUdpdateUser = async (request: Colmena.SecureFunctionRequest) => {
  try {
    const { params, user } = request;
    return UserService.updateUser(params, user);
  } catch (err) {
    throw new Error(err.message);
  }
};

const adminDeleteUser = async (request: Colmena.SecureFunctionRequest) => {
  try {
    const { params, user } = request;
    const { userId } = params;
    return UserService.deleteUser(userId, user);
  } catch (err) {
    throw new Error(err.message);
  }
};
export default {
  adminFindUser,
  adminFindUserBy,
  adminFindUserById,
  adminCreateUser,
  adminUdpdateUser,
  adminDeleteUser,
};
