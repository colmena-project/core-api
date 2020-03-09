/* eslint-disable no-unused-vars */
const { GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY } = process.env;

const distanceCalculate = (request) => ({ distance: '2km' });

module.exports = {
  distanceCalculate,
};
