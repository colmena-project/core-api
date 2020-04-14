const findWasteTypeById = async (id: string): Promise<Parse.Object> => {
  try {
    const wasteTypeQuery: Parse.Query = new Parse.Query('WasteType');
    const wasteType = await wasteTypeQuery.get(id, { useMasterKey: true });
    return wasteType;
  } catch (error) {
    throw new Error(`WasteType ${id} not found`);
  }
};

const getWasteTypesFromIds = async (wasteTypesIds: string[] = []): Promise<Map<string, Parse.Object>> => {
  const wasteTypes: Map<string, Parse.Object> = new Map();
  const types: Parse.Object[] = await Promise.all(wasteTypesIds.map((id) => findWasteTypeById(id)));
  types.forEach((t) => wasteTypes.set(t.id, t));
  return wasteTypes;
};

export default {
  findWasteTypeById,
  getWasteTypesFromIds,
};
