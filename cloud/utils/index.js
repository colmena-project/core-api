const clearSessionsFromUser = async (user) => {
  const query = new Parse.Query(Parse.Session);
  query.equalTo("user", user.toPointer());
  const sessions = await query.find({ useMasterKey: true });
  const promises = sessions.map(session => session.destroy({ useMasterKey: true }));
  const sessionsCleared = await Promise.all(promises);
  return { sessions: sessionsCleared };
}

module.exports = {
  clearSessionsFromUser,
}