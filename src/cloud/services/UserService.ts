// import Account from '../classes/Account';
import { AccountService, RoleService } from '.';
import RecyclingCenterService from './RecyclingCenterService';

const findRolesByUser = async (user: Parse.User): Promise<Parse.Object[]> => {
  const roles: Parse.Object[] = await new Parse.Query(Parse.Role).equalTo('users', user).find();
  return roles;
};

const clearUserSessions = async (user: Parse.User): Promise<{ sessions: string[] }> => {
  const query: Parse.Query = new Parse.Query(Parse.Session);
  query.equalTo('user', user.toPointer());
  const sessions = await query.find({ useMasterKey: true });
  const promises = sessions.map((session) => session.destroy({ useMasterKey: true }));
  const sessionsCleared: Parse.Object[] = await Promise.all(promises);
  return { sessions: sessionsCleared.map((s) => s.get('sessionToken')) };
};

const findUserById = async (id: string): Promise<Parse.User> => {
  try {
    const query: Parse.Query = new Parse.Query(Parse.User);
    // eslint-disable-next-line keyword-spacing
    const user = <Parse.User>await query.get(id, { useMasterKey: true });
    return user;
  } catch (error) {
    throw new Error(`User ${id} not found`);
  }
};

const checkUserisAdmin = async (user: Parse.User) => {
  const roleAdmin: Parse.Role | undefined = await RoleService.findByName('ROLE_ADMIN');
  if (roleAdmin) {
    const users = <Parse.Relation>roleAdmin.get('users');
    try {
      await users.query().get(user.id);
    } catch (error) {
      throw new Error('User is not allowed to operate in the Administrator');
    }
  } else {
    throw new Error('The Admin Role does not exist');
  }
};

const findUser = async (
  displayLimit: number,
  page: number,
  currentUser: Parse.User,
): Promise<Parse.Object[]> => {
  try {
    await checkUserisAdmin(currentUser);
    const query: Parse.Query = new Parse.Query(Parse.User);
    query.limit(displayLimit);
    query.skip(page * displayLimit);

    const res = await query.find({ useMasterKey: true });
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
};

const findUserBy = async ({
  findBy,
  displayLimit,
  page,
  currentUser,
}: {
  findBy: string[];
  displayLimit: number;
  page: number;
  currentUser: Parse.User;
}): Promise<Parse.Object[]> => {
  try {
    await checkUserisAdmin(currentUser);
    const query: Parse.Query = new Parse.Query(Parse.User);
    query.limit(displayLimit);
    query.skip(page * displayLimit);
    Object.entries(findBy).forEach((entry) => {
      const [key, value] = entry;
      query.startsWith(key, value);
    });
    const res = await query.find({ useMasterKey: true });
    return res;
  } catch (err) {
    throw new Error(err.message);
  }
};

const createUser = async (params: any, currentUser: Parse.User) => {
  try {
    await checkUserisAdmin(currentUser);
    const User = Parse.Object.extend('_User');
    const user: Parse.User = new User();
    const {
      username,
      email,
      password,
      emailVerified,
      factory,
      firstName,
      middleName,
      lastName,
      nickname,
      aboutMe,
    } = params;

    const values = {
      username,
      email,
      password,
      emailVerified,
    };

    await user.save(values, {
      useMasterKey: true,
    });

    factory.forEach(async (element: string) => {
      const recycling: Parse.Object = await RecyclingCenterService.findRecyclingCenterById(element);
      const relation = user.relation('recyclingCenter');
      relation.add(recycling);
      const role: Parse.Role | undefined = await recycling.get('role');
      if (role) {
        await role.fetch();
        role.getUsers().add(user);
        role.save(null, { useMasterKey: true });
      }
    });

    if (factory.length > 0) {
      const roleFactory: Parse.Role | undefined = await RoleService.findByName('ROLE_FACTORY');
      if (roleFactory) {
        roleFactory.getUsers().add(user);
        await roleFactory.save(null, { useMasterKey: true });
      }
    }

    const account: Parse.Object = await AccountService.createAccountWithUser({
      username,
      firstName,
      middleName,
      lastName,
      nickname,
      aboutMe,
      user,
    });

    return user;
  } catch (err) {
    throw new Error(err.message);
  }
};

const updateUser = async (params: any, currentUser: Parse.User) => {
  const { id, data } = params;
  try {
    await checkUserisAdmin(currentUser);

    // get the User to edit
    const query: Parse.Query = new Parse.Query(Parse.User);
    const user: Parse.User = <Parse.User>await query.get(id, { useMasterKey: true });

    const {
      username,
      email,
      password,
      emailVerified,
      factory,
      firstName,
      middleName,
      lastName,
      nickname,
      aboutMe,
    } = data;

    if (factory) {
      // if the Use has a new factory selected, so a role is assign
      const roleFactory = await RoleService.findByName('ROLE_FACTORY');
      if (factory.length > 0) {
        if (roleFactory) {
          roleFactory.getUsers().add(user);
          await roleFactory.save(null, { useMasterKey: true });
        }
      }

      const recyclingCentersRelation = await user.relation('recyclingCenter');
      let recyclingCenters = await recyclingCentersRelation.query().find();

      // Add the RecyclingCenter to the user data
      factory &&
        factory.map(async (idFactory: string) => {
          const query = new Parse.Query('RecyclingCenter');
          query.equalTo('objectId', idFactory);
          const recyclingCenterToAddTo = await query.first({ useMasterKey: true });

          if (recyclingCenterToAddTo) {
            recyclingCentersRelation.add(recyclingCenterToAddTo);
            const role: Parse.Role | undefined = await recyclingCenterToAddTo.get('role');
            if (role) {
              await role.fetch();
              role.getUsers().add(user);
              role.save(null, { useMasterKey: true });
            }
          }

          recyclingCenters = recyclingCenters.filter(
            (value: Parse.Object) => value.id !== idFactory,
          );
        });

      // If a RecyclingCenter is remove
      recyclingCenters.map(async (recyclingCentersRemove: Parse.Object) => {
        await recyclingCentersRelation.remove(recyclingCentersRemove);
        const role: Parse.Role | undefined = await recyclingCentersRemove.get('role');
        if (role) {
          await role.fetch();
          role.getUsers().remove(user);
          role.save(null, { useMasterKey: true });
        }
      });
    }

    let userValues: Colmena.UserType;

    const accountValues = {
      user,
      firstName,
      middleName,
      lastName,
      nickname,
      aboutMe,
    };
    const queryAccount: Parse.Query = new Parse.Query('Account');
    queryAccount.equalTo('user', user);
    const account: Parse.Object | undefined = await queryAccount.first();

    // Update the Account Data or create a new
    if (account) {
      await account.save(accountValues, {
        useMasterKey: true,
      });
    } else {
      const account: Parse.Object = await AccountService.createAccountWithUser({
        username,
        firstName,
        middleName,
        lastName,
        nickname,
        aboutMe,
        user,
      });
    }

    userValues = {
      username,
      email,
      emailVerified,
    };

    userValues = password !== '' ? { ...userValues, password } : { ...userValues };

    // Update User data
    await user.save(userValues, {
      useMasterKey: true,
    });

    return user;
  } catch (error) {
    throw new Error(`Error with User ${id}, ${error}`);
  }
};

const deleteUser = async (userId: any, currentUser: Parse.User) => {
  try {
    await checkUserisAdmin(currentUser);
    const query = new Parse.Query('_User');
    query.equalTo('objectId', userId);
    const userObject = await query.first({ useMasterKey: true });
    userObject && (await userObject.destroy({ useMasterKey: true }));
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
};

const checkUserHasRecyclingCenter = async (
  recyclingCenter: Parse.Object,
  user: Parse.User,
): Promise<boolean> => {
  const recyclingCentersUsers: Parse.Object[] = await user
    .relation('recyclingCenter')
    .query()
    .find();

  if (recyclingCentersUsers.indexOf(recyclingCenter) > -1) {
    return false;
  }

  return true;
};

export default {
  findUserById,
  findRolesByUser,
  clearUserSessions,
  findUser,
  findUserBy,
  createUser,
  updateUser,
  deleteUser,
  checkUserisAdmin,
  checkUserHasRecyclingCenter,
};
