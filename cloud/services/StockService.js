const { Parse } = global;
const WasteTypeService = require('./WasteTypeService');

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

const incrementStock = async (typeId, user, ammount = 1) => {
  const wasteType = await WasteTypeService.findWasteTypeById(typeId);
  const userStock = await getStockOfType(wasteType, user);
  userStock.increment('ammount', ammount);
  const acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  userStock.setACL(acl);
  userStock.save(null, { useMasterKey: true });
};

const decrementStock = async (typeId, user, ammount) => {
  const wasteType = await WasteTypeService.findWasteTypeById(typeId);
  const userStock = await getStockOfType(wasteType, user);
  userStock.decrement('ammount', ammount);
  userStock.save(null, { useMasterKey: true });
};

module.exports = {
  incrementStock,
  decrementStock,
  getUserStock,
};
