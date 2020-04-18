import { getQueryAuthOptions } from '../utils';

const getUserStock = async (user: Parse.User): Promise<Parse.Object[]> => {
  const authOptions = getQueryAuthOptions(undefined, true);
  const stockQ: Parse.Query = new Parse.Query('UserStock');
  stockQ.include('wasteType');
  stockQ.equalTo('user', user);
  const stock: Parse.Object[] = await stockQ.find(authOptions);
  return stock;
};

const getStockOfType = async (type: Parse.Object, user: Parse.User): Promise<Parse.Object> => {
  const authOptions = getQueryAuthOptions(undefined, true);
  const userStockQuery: Parse.Query = new Parse.Query('UserStock');
  userStockQuery.equalTo('wasteType', type.toPointer());
  userStockQuery.equalTo('user', user.toPointer());
  let userStock = await userStockQuery.first(authOptions);
  if (!userStock) {
    userStock = new Parse.Object('UserStock');
    userStock.set('wasteType', type);
    userStock.set('user', user);
    const acl: Parse.ACL = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setReadAccess(user.id, true);
    acl.setWriteAccess(user.id, true);
    userStock.setACL(acl);
    await userStock.save(null, authOptions);
  }
  return userStock;
};

const incrementStock = async (
  wasteType: Parse.Object,
  user: Parse.User,
  ammount: number = 1,
): Promise<Parse.Object> => {
  const authOptions = getQueryAuthOptions(undefined, true);
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', ammount);
  return userStock.save(null, authOptions);
};

const decrementStock = async (
  wasteType: Parse.Object,
  user: Parse.User,
  ammount: number = 1,
): Promise<Parse.Object> => {
  const authOptions = getQueryAuthOptions(undefined, true);
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', -ammount);
  return userStock.save(null, authOptions);
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
