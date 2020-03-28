const { Parse } = global;

const findWasteTypeById = async (id) => {
  try {
    const wasteTypeQuery = new Parse.Query('WasteType');
    const wasteType = await wasteTypeQuery.get(id, { useMasterKey: true });
    return wasteType;
  } catch (error) {
    throw new Error(`Invalid WasteType ${id} provided`);
  }
};

const getWasteTypesFromIds = async (wasteTypesIds = []) => {
  const wasteTypes = new Map();
  const promisses = wasteTypesIds.map((id) => findWasteTypeById(id));
  const types = await Promise.all(promisses);
  types.forEach((t) => wasteTypes.set(t.id, t));
  return wasteTypes;
};

module.exports = {
  findWasteTypeById,
  getWasteTypesFromIds,
};
