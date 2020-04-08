const { Parse } = global;

const getUserStock = async (user) => {
  const stockQ = new Parse.Query('UserStock');
  stockQ.include('wasteType');
  const stock = await stockQ.find({ sessionToken: user.getSessionToken() });
  return stock;
};

const getStockOfType = async (type, user) => {
  const userStockQuery = new Parse.Query('UserStock');
  userStockQuery.equalTo('wasteType', type);
  userStockQuery.equalTo('user', user);
  let userStock = await userStockQuery.first({ useMasterKey: true });
  if (!userStock) {
    userStock = new Parse.Object('UserStock');
    userStock.set('wasteType', type);
    userStock.set('user', user);
    await userStock.save(null, { useMasterKey: true });
  }
  return userStock;
};

const incrementStock = async (wasteType, user, ammount = 1) => {
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', ammount);
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  userStock.setACL(acl);
  await userStock.save(null, { useMasterKey: true });
  return userStock;
};

const decrementStock = async (wasteType, user, ammount = 1) => {
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', -ammount);
  await userStock.save(null, { useMasterKey: true });
  return userStock;
};

const moveStock = async (wasteType, from, to, ammount = 1) => {
  let fromStock;
  let toStock;
  try {
    fromStock = await decrementStock(wasteType, from, ammount);
    toStock = await incrementStock(wasteType, to, ammount);
  } catch (error) {
    if (fromStock) await incrementStock(wasteType, from, ammount);
    if (toStock) await decrementStock(wasteType, to, ammount);
    throw error;
  }
};

module.exports = {
  incrementStock,
  decrementStock,
  moveStock,
  getUserStock,
};
