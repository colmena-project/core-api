import { RecyclingCenter } from '../classes';
import { RoleService } from '.';
import { normalizeRoleName } from '../utils/role';
import { encrypt } from '../utils/cryptography';

const findRecyclingCenterById = async (id: string): Promise<Parse.Object> => {
  try {
    const query: Parse.Query = new Parse.Query('RecyclingCenter');
    const recyclingCenter: Parse.Object = await query.get(id, { useMasterKey: true });
    return recyclingCenter;
  } catch (error) {
    throw new Error(`RecyclingCenter ${id} not found`);
  }
};

const createRecyclingCenter = async (
  params: Colmena.RecyclingCenterType,
  currentUser: Parse.User,
): Promise<Parse.Object> => {
  const { name, secondName, description, latLng, email, walletId, walletToken } = params;
  const nameNormalize = normalizeRoleName(`ROL_RC_${name}`);
  let role: Parse.Object | undefined = await RoleService.findByName(nameNormalize);
  if (!role) {
    role = await RoleService.createRole({ name: nameNormalize }, currentUser);
  }

  const encryptText = walletToken ? encrypt(walletToken) : undefined;

  const recyclingCenter: Parse.Object = new RecyclingCenter();
  recyclingCenter.set('role', role);
  await recyclingCenter.save({
    name,
    secondName,
    description,
    latLng,
    email,
    walletId,
    walletToken: encryptText,
  });

  return recyclingCenter;
};

const editRecyclingCenter = async (
  params: Colmena.RecyclingCenterType,
  currentUser: Parse.User,
): Promise<Parse.Object> => {
  const { id, name, secondName, description, latLng, email } = params;
  if (!id) {
    throw new Error('RecyclingCenter id is missing');
  }
  const recyclingCenter: Parse.Object | undefined = await findRecyclingCenterById(id);
  if (!recyclingCenter) {
    throw new Error(`RecyclingCenter ${id} not found`);
  }

  const normalizedName = normalizeRoleName(`ROL_RC_${name}`);
  let role: Parse.Role | undefined = await recyclingCenter.get('role');
  if (role) {
    await role.fetch();
    if (role.get('name') !== normalizedName) {
      role = await RoleService.changaNameRole({ role, newName: normalizedName, currentUser });
    }
  } else {
    role = await RoleService.createRole({ name: normalizedName }, currentUser);
  }

  recyclingCenter.set('role', role);

  await recyclingCenter.save({
    name,
    secondName,
    description,
    latLng,
    email,
  });

  return recyclingCenter;
};

const deleteRecyclingCenter = async ({ id }: { id: string }): Promise<boolean> => {
  const recyclingCenter: Parse.Object = await findRecyclingCenterById(id);
  const nameNormalize = normalizeRoleName(`ROL_RC_${recyclingCenter.get('id')}`);
  await RoleService.deleteRole(nameNormalize);
  await recyclingCenter?.destroy();
  return true;
};

export default {
  findRecyclingCenterById,
  createRecyclingCenter,
  editRecyclingCenter,
  deleteRecyclingCenter,
};
