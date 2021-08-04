import { UserService } from '../services';


const findUserAdmin = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object[]> => {
  const { params, user } = request;
  const { displayLimit, page } = params;
  return UserService.findUserAdmin(displayLimit, page);
}
const adminFindUserBy = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object[]> => {
  const { params, user } = request;
  const { search, displayLimit, page } = params;
  return UserService.findUserByAdmin({findBy: search,displayLimit:displayLimit, page:page});
}
const adminFindUserById = async (request: Colmena.SecureFunctionRequest): Promise<Parse.User> => {
  const { params } = request;
  const { id } = params;
  return await UserService.findUserById(id);
}
const createUserAdmin = async (request: Colmena.SecureFunctionRequest) => {
  try {
    const { params, user } = request;
    return UserService.createUserAdmin(params,user);
  } catch (err){
    throw new Error(err.message);
  }
};

const udpdateUserAdmin = async (request: Colmena.SecureFunctionRequest) => {
  try {
    const { params } = request;
    return UserService.udpdateUserAdmin(params);
  } catch (err){
    throw new Error(err.message);
  }
};


const deleteUserAdmin =  async (userId:any) => {
  try {
    console.log(userId);
    const query = new Parse.Query("_User");
    query.equalTo('objectId', userId);
    const userObject = await query.first({ useMasterKey: true });
    (userObject) && await userObject.destroy({ useMasterKey: true });
    return true;
  } catch (err){
    throw new Error(err.message);
  }
};
export default {
  findUserAdmin,
  adminFindUserBy,
  adminFindUserById,
  createUserAdmin,
  udpdateUserAdmin,
  deleteUserAdmin,
};
