const { Parse } = global;

const wasteTypeCache = new Map();

const findWasteTypeById = async (id) => {
  try {
    if (wasteTypeCache.has(id)) return wasteTypeCache.get(id);
    const wasteTypeQuery = new Parse.Query('WasteType');
    const wasteType = await wasteTypeQuery.get(id, { useMasterKey: true });
    wasteTypeCache.set(id, wasteType);
    return wasteType;
  } catch (error) {
    throw new Error(`Invalid WasteType ${id} provided`);
  }
};

module.exports = {
  findWasteTypeById,
};
