import Account from '../classes/Account';
import { RoleService } from '.';
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
  const roleFactory: Parse.Role | undefined = await RoleService.findByName('ROLE_ADMIN');
  if (roleFactory) {
    const users = <Parse.Relation>roleFactory.get('users');
    try {
      await users.query().get(user.id);
    } catch (error) {
      throw new Error('User is not allowed to operate in the domain');
    }
  } else {
    throw new Error('The Factory Role does not exist');
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
      username: username,
      email: email,
      password: password,
      emailVerified: emailVerified,
    };

    await user.save(values, {
      useMasterKey: true,
    });

    factory.forEach(async (element: string) => {
      const recycling: Parse.Object = await RecyclingCenterService.findRecyclingCenterById(element);
      var relation = user.relation('recyclingCenter');
      relation.add(recycling);
    });

    if (factory.length > 0) {
      const roleFactory: Parse.Role | undefined = await RoleService.findByName('ROLE_FACTORY');
      if (roleFactory) {
        roleFactory.getUsers().add(user);
        await roleFactory.save(null, { useMasterKey: true });
      }
    }

    const account: Parse.Object = new Account();
    const valuesAccount = {
      user: user,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      nickname: nickname,
      aboutMe: aboutMe,
    };
    account.save(valuesAccount, {
      useMasterKey: true,
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

    //get the User to edit
    const query: Parse.Query = new Parse.Query(Parse.User);
    const user = <Parse.User>await query.get(id, { useMasterKey: true });

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

    if (factory !== undefined) {
      //if the Use has a new factory selected, so a role is assign
      const roleFactory = await RoleService.findByName('ROLE_FACTORY');
      if (factory.length > 0) {
        if (roleFactory) {
          roleFactory.getUsers().add(user);
          await roleFactory.save(null, { useMasterKey: true });
        }
      }

      const recyclingCentersRelation = await user.relation('recyclingCenter');
      let recyclingCenters = await recyclingCentersRelation.query().find();

      //Add the RecyclingCenter to the user data
      factory !== undefined &&
        factory.map(async (idFactory: string) => {
          const query = new Parse.Query('RecyclingCenter');
          query.equalTo('objectId', idFactory);
          const recyclingCenterToAddTo = await query.first({ useMasterKey: true });

          recyclingCenterToAddTo !== undefined &&
            recyclingCentersRelation.add(recyclingCenterToAddTo);

          recyclingCenters = recyclingCenters.filter((value: Parse.Object) => {
            return value.id !== idFactory;
          });
        });

      //If a RecyclingCenter is remove
      recyclingCenters.map((recyclingCentersRemove: Parse.Object) => {
        recyclingCentersRelation.remove(recyclingCentersRemove);
      });
    }

    let userValues: Colmena.UserType;

    const accountValues = {
      user: user,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      nickname: nickname,
      aboutMe: aboutMe,
    };
    const queryAccount = new Parse.Query('Account');
    queryAccount.equalTo('user', user);
    const account = await queryAccount.first();

    // Update the Account Data or create a new
    if (account) {
      await account.save(accountValues, {
        useMasterKey: true,
      });
    } else {
      const newAccount: Parse.Object = new Account();
      await newAccount.save(accountValues, {
        useMasterKey: true,
      });
    }

    userValues = {
      username: username,
      email: email,
      emailVerified: emailVerified,
    };

    userValues = password !== '' ? { ...userValues, password: password } : { ...userValues };

    //Update User data
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
};
