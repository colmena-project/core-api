const { Parse } = global;

const findRolesByUser = async (user) => {
  const roles = await new Parse.Query(Parse.Role).equalTo('users', user).find();
  return roles;
};

const clearUserSessions = async (user) => {
  const query = new Parse.Query(Parse.Session);
  query.equalTo('user', user.toPointer());
  const sessions = await query.find({ useMasterKey: true });
  const promises = sessions.map((session) => session.destroy({ useMasterKey: true }));
  const sessionsCleared = await Promise.all(promises);
  return { sessions: sessionsCleared.map((s) => s.get('sessionToken')) };
};

const findUserById = async (id) => {
  try {
    const query = new Parse.Query(Parse.User);
    const container = await query.get(id, { useMasterKey: true });
    return container;
  } catch (error) {
    throw new Error(`User ${id} not found`);
  }
};

module.exports = {
  findUserById,
  findRolesByUser,
  clearUserSessions,
};
