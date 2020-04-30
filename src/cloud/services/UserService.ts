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

export default {
  findUserById,
  findRolesByUser,
  clearUserSessions,
};
