import { RoleService } from '../services';

const createRole = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params } = request;
  return RoleService.createRole(<Colmena.RoleType>params);
};

const editRole = async (request: Colmena.SecureFunctionRequest): Promise<Parse.Object> => {
  const { params } = request;
  return RoleService.updateRole(<Colmena.RoleType>params);
};

export default {
  createRole,
  editRole,
};
