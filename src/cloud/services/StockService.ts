const getUserStock = async (user: Parse.User): Promise<Parse.Object[]> => {
  const stockQ: Parse.Query = new Parse.Query('UserStock');
  stockQ.include('wasteType');
  const stock: Parse.Object[] = await stockQ.find({ sessionToken: user.getSessionToken() });
  return stock;
};

const getStockOfType = async (type: Parse.Object, user: Parse.User): Promise<Parse.Object> => {
  const userStockQuery: Parse.Query = new Parse.Query('UserStock');
  userStockQuery.equalTo('wasteType', type.toPointer());
  userStockQuery.equalTo('user', user.toPointer());
  let userStock = await userStockQuery.first({ useMasterKey: true });
  if (!userStock) {
    userStock = new Parse.Object('UserStock');
    userStock.set('wasteType', type);
    userStock.set('user', user);
    const acl: Parse.ACL = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    userStock.setACL(acl);
    await userStock.save(null, { useMasterKey: true });
  }
  return userStock;
};

const incrementStock = async (
  wasteType: Parse.Object,
  user: Parse.User,
  ammount: number = 1,
): Promise<Parse.Object> => {
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', ammount);
  return userStock.save(null, { useMasterKey: true });
};

const decrementStock = async (
  wasteType: Parse.Object,
  user: Parse.User,
  ammount: number = 1,
): Promise<Parse.Object> => {
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', -ammount);
  return userStock.save(null, { useMasterKey: true });
};

const moveStock = async (
  wasteType: Parse.Object,
  from: Parse.User,
  to: Parse.User,
  ammount: number = 1,
): Promise<void> => {
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

export default {
  incrementStock,
  decrementStock,
  moveStock,
  getUserStock,
};
