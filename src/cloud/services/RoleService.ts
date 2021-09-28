import { UserService } from '.';

const normalizeNameRole = (name: string): string => {
  return name
    .toUpperCase()
    .replace(/ /g, '_')
    .replace(/[^\w-]+/g, '');
};

const createRole = async (
  params: Colmena.RoleType,
  currentUser: Parse.User,
): Promise<Parse.Role> => {
  const { name, users, roles } = params;

  const nameNormalize = normalizeNameRole(name);

  await UserService.checkUserisAdmin(currentUser);
  const roleACL = new Parse.ACL();
  roleACL.setPublicReadAccess(true);
  roleACL.setPublicWriteAccess(true);
  const role: Parse.Role = new Parse.Role(nameNormalize, roleACL);

  users &&
    users.map((idUser) => {
      const usersToAddToRole = new Parse.User();
      usersToAddToRole.id = idUser;
      role.getUsers().add(usersToAddToRole);
    });

  roles &&
    roles.map(async (idRole) => {
      const query = new Parse.Query(Parse.Role);
      query.equalTo('objectId', idRole);
      const roleToAddToRole = await query.first({ useMasterKey: true });
      roleToAddToRole && role.getRoles().add(roleToAddToRole);
    });

  await role.save(null, {
    useMasterKey: true,
  });
  return role;
};

const updateRole = async (
  params: Colmena.RoleType,
  currentUser: Parse.User,
): Promise<Parse.Object> => {
  const { id, name, users, roles } = params;

  await UserService.checkUserisAdmin(currentUser);

  const nameNormalize = normalizeNameRole(name);

  const query = new Parse.Query(Parse.Role);
  query.equalTo('objectId', id);
  const role = await query.first({ useMasterKey: true });
  if (!role) {
    throw new Error('The Role is not found');
  } else {
    let usersRole = await role
      .getUsers()
      .query()
      .find();

    users &&
      users.map((idUser) => {
        const usersToAddToRole = new Parse.User();
        usersToAddToRole.id = idUser;
        role.getUsers().add(usersToAddToRole);

        usersRole = usersRole.filter((value) => {
          return value.id !== idUser;
        });
      });

    usersRole.map((user) => {
      role.getUsers().remove(user);
    });

    let rolesRole = await role
      .getRoles()
      .query()
      .find();
    roles &&
      roles.map(async (idRole) => {
        const query = new Parse.Query(Parse.Role);
        query.equalTo('objectId', idRole);
        const roleToAddToRole = await query.first({ useMasterKey: true });
        roleToAddToRole && role.getRoles().add(roleToAddToRole);

        rolesRole = rolesRole.filter((value) => {
          return value.id !== idRole;
        });
      });

    rolesRole.map((roleRemove) => {
      role.getRoles().remove(roleRemove);
    });

    //update relations
    await role.save(null, {
      useMasterKey: true,
    });

    return role;
  }
};

const changaNameRole = async ({
  role,
  newName,
  currentUser,
}: {
  role: Parse.Role;
  newName: string;
  currentUser: Parse.User;
}): Promise<Parse.Role> => {
  const idPersonas = Array();
  let usersRole = await role
    .getUsers()
    .query()
    .find();
  usersRole.forEach((userRoel) => {
    idPersonas.push(userRoel.id);
  });
  const idRoles = Array();
  let rolesRole = await role
    .getRoles()
    .query()
    .find();
  rolesRole.forEach((roleRole) => {
    idRoles.push(roleRole.id);
  });

  const newRole: Parse.Role = await createRole(
    { name: newName, users: idPersonas, roles: idRoles },
    currentUser,
  );

  await deleteRole(role.get('name'));

  return newRole;
};

const findByName = async (name: string): Promise<Parse.Role | undefined> => {
  const nameNormalize = normalizeNameRole(name);
  const query = new Parse.Query(Parse.Role);
  query.equalTo('name', nameNormalize);

  const roleSearch = await query.first({ useMasterKey: true });
  return roleSearch;
};

const deleteRole = async (name: string): Promise<void> => {
  const role = await findByName(name);
  await role?.destroy({ useMasterKey: true });
};

export default {
  createRole,
  updateRole,
  findByName,
  deleteRole,
  normalizeNameRole,
  changaNameRole,
};
