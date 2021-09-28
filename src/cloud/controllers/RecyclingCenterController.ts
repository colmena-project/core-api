import { RecyclingCenterService } from '../services';

const findRecyclingCenterById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { objectId } = params;
  return await RecyclingCenterService.findRecyclingCenterById(objectId);
};

const createRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { name, description, latLng } = params;
  return await RecyclingCenterService.createRecyclingCenter({ name, description, latLng }, user);
};

const editRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { id, name, description, latLng } = params;
  return await RecyclingCenterService.editRecyclingCenter({ id, name, description, latLng }, user);
};

const deleteRecyclingCenter = async (request: Colmena.SecureFunctionRequest): Promise<boolean> => {
  const { params, user } = request;
  const { id } = params;
  return await RecyclingCenterService.deleteRecyclingCenter({ id });
};

export default {
  findRecyclingCenterById,
  createRecyclingCenter,
  editRecyclingCenter,
  deleteRecyclingCenter,
};
