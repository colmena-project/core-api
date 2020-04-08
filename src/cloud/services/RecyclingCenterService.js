const { Parse } = global;

const findRecyclingCenterById = async (id) => {
  try {
    const query = new Parse.Query('RecyclingCenter');
    const recyclingCenter = await query.get(id, { useMasterKey: true });
    return recyclingCenter;
  } catch (error) {
    throw new Error(`RecyclingCenter ${id} not found`);
  }
};

module.exports = {
  findRecyclingCenterById,
};
