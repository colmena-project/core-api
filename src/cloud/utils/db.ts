/* eslint-disable import/prefer-default-export */
import { getDatabaseInstance } from './core';

const getValueForNextSequence = async (sequenceOfName: string): Promise<number> => {
  const db = getDatabaseInstance();
  // eslint-disable-next-line no-underscore-dangle
  const _sequences = db.collection('_sequences');
  const { value } = await _sequences.findOneAndUpdate(
    { _id: sequenceOfName },
    { $inc: { sequence_value: 1 } },
    { upsert: true },
  );
  return !value ? value + 1 : value.sequence_value + 1;
};


export {
  getValueForNextSequence,
};
