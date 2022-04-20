import { RecyclingCenterService } from '../services';

const findRecyclingCenterById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { objectId } = params;
  return RecyclingCenterService.findRecyclingCenterById(objectId);
};

const createRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { name, description, latLng, walletId, walletToken } = params;
  return await RecyclingCenterService.createRecyclingCenter(
    {
      name,
      description,
      latLng,
      walletId,
      walletToken,
    },
    user,
  );
};

const editRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { id, name, description, latLng, walletId, walletToken } = params;
  return await RecyclingCenterService.editRecyclingCenter(
    {
      id,
      name,
      description,
      latLng,
      walletId,
      walletToken,
    },
    user,
  );
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
