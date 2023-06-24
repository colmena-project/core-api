import { RecyclingCenterService, WalletServices } from '../services';

const findRecyclingCenterById = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params } = request;
  const { objectId } = params;
  return RecyclingCenterService.findRecyclingCenterById(objectId);
};

const createRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { name, secondName, description, latLng, email } = params;

  const wallet = await WalletServices.createWallet(name, secondName, email);
  if (!wallet || !wallet.id || !wallet.token) {
    throw new Error('Wallet not created');
  }

  return RecyclingCenterService.createRecyclingCenter(
    {
      name,
      secondName,
      description,
      latLng,
      email,
      walletId: wallet.id,
      walletToken: wallet.token,
    },
    user,
  );
};

const editRecyclingCenter = async (
  request: Colmena.SecureFunctionRequest,
): Promise<Parse.Object> => {
  const { params, user } = request;
  const { id, name, secondName, description, latLng, email } = params;
  return RecyclingCenterService.editRecyclingCenter(
    {
      id,
      name,
      secondName,
      description,
      latLng,
      email,
    },
    user,
  );
};

const deleteRecyclingCenter = async (request: Colmena.SecureFunctionRequest): Promise<boolean> => {
  const { params } = request;
  const { id } = params;
  return RecyclingCenterService.deleteRecyclingCenter({ id });
};

const refreshToken = async (
  request: Colmena.SecureFunctionRequest,
): Promise<{ status: boolean; message: string }> => {
  const { params } = request;
  const { id } = params;
  const recyclingCenter = await RecyclingCenterService.findRecyclingCenterById(id);
  return WalletServices.refreshToken(recyclingCenter.get('walletId'));
};

const storeNewToken = async (
  request: Colmena.SecureFunctionRequest,
): Promise<{ status: boolean; message: string }> => {
  const { params } = request;
  const { id, securityCode } = params;

  const recyclingCenter = await RecyclingCenterService.findRecyclingCenterById(id);
  const walletResponse = await WalletServices.confirmNewToken(
    recyclingCenter.get('walletId'),
    securityCode,
  );

  if (walletResponse.status) {
    // store the new token
    recyclingCenter.set('walletToken', walletResponse.privateKey);
    await recyclingCenter.save();
    return { status: true, message: walletResponse.message };
  }
  return { status: false, message: walletResponse.message };
};

export default {
  findRecyclingCenterById,
  createRecyclingCenter,
  editRecyclingCenter,
  deleteRecyclingCenter,
  refreshToken,
  storeNewToken,
};
