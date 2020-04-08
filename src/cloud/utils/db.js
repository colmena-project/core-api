/* eslint-disable no-underscore-dangle */
const { getDatabaseInstance } = require('./core');

const getValueForNextSequence = async (sequenceOfName) => {
  const db = getDatabaseInstance();
  const _sequences = db.collection('_sequences');
  const { value } = await _sequences.findOneAndUpdate(
    { _id: sequenceOfName },
    { $inc: { sequence_value: 1 } },
    { upsert: true },
  );
  return !value ? value + 1 : value.sequence_value + 1;
};

module.exports = {
  getValueForNextSequence,
};
