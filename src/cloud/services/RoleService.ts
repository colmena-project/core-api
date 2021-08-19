import { UserService } from '.';

const createRole = async (
  params: Colmena.RoleType,
  currentUser: Parse.User,
): Promise<Parse.Object> => {
  const { name, users, roles } = params;

  await UserService.checkUserisAdmin(currentUser);
  const roleACL = new Parse.ACL();
  roleACL.setPublicReadAccess(true);
  roleACL.setPublicWriteAccess(true);
  const role: Parse.Role = new Parse.Role(name, roleACL);

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

    await role.save(
      { name: name },
      {
        useMasterKey: true,
      },
    );
    return role;
  }
};

const findByName = async (name: string): Promise<Parse.Role | undefined> => {
  const query = new Parse.Query(Parse.Role);
  query.equalTo('name', name);
  return await query.first({ useMasterKey: true });
};

export default {
  createRole,
  updateRole,
  findByName,
};
