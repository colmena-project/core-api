/* @flow  */
import type { ParseObject, ParseUser } from '../../flow-types';

const { Parse } = global;

const findRolesByUser = async (user: ParseUser): Promise<ParseObject[]> => {
  const roles: ParseObject[] = await new Parse.Query(Parse.Role).equalTo('users', user).find();
  return roles;
};

const clearUserSessions = async (user: ParseUser): Promise<{ sessions: string[] }> => {
  const query = new Parse.Query(Parse.Session);
  query.equalTo('user', user.toPointer());
  const sessions = await query.find({ useMasterKey: true });
  const promises = sessions.map((session) => session.destroy({ useMasterKey: true }));
  const sessionsCleared: ParseObject[] = await Promise.all(promises);
  return { sessions: sessionsCleared.map((s) => s.get('sessionToken')) };
};

const findUserById = async (id: string): Promise<ParseUser> => {
  try {
    const query = new Parse.Query(Parse.User);
    const user: ParseUser = await query.get(id, { useMasterKey: true });
    return user;
  } catch (error) {
    throw new Error(`User ${id} not found`);
  }
};

module.exports = {
  findUserById,
  findRolesByUser,
  clearUserSessions,
};
