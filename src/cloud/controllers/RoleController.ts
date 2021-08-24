import { RoleService } from '../services';

const createRole = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params, user } = request;
  return RoleService.createRole(<Colmena.RoleType>params, user);
};

const editRole = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params, user } = request;
  return RoleService.updateRole(<Colmena.RoleType>params, user);
};

export default {
  createRole,
  editRole,
};
