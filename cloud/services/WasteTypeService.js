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

module.exports = {
  findWasteTypeById,
};
