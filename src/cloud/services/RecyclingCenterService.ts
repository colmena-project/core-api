
const findRecyclingCenterById = async (id: string): Promise<Parse.Object> => {
  try {
    const query: Parse.Query = new Parse.Query('RecyclingCenter');
    const recyclingCenter: Parse.Object = await query.get(id, { useMasterKey: true });
    return recyclingCenter;
  } catch (error) {
    throw new Error(`RecyclingCenter ${id} not found`);
  }
};

export default {
  findRecyclingCenterById,
};
