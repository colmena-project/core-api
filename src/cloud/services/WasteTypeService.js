/* @flow  */
import type { ParseObject } from '../../flow-types';

const { Parse } = global;

const findWasteTypeById = async (id: string): Promise<ParseObject> => {
  try {
    const wasteTypeQuery = new Parse.Query('WasteType');
    const wasteType = await wasteTypeQuery.get(id, { useMasterKey: true });
    return wasteType;
  } catch (error) {
    throw new Error(`WasteType ${id} not found`);
  }
};

const getWasteTypesFromIds = async (wasteTypesIds: string[] = []): Promise<Map<string, ParseObject>> => {
  const wasteTypes: Map<string, ParseObject> = new Map();
  const promisses = wasteTypesIds.map((id) => findWasteTypeById(id));
  const types = await Promise.all(promisses);
  types.forEach((t) => wasteTypes.set(t.id, t));
  return wasteTypes;
};

module.exports = {
  findWasteTypeById,
  getWasteTypesFromIds,
};
