/* eslint-disable no-unused-vars */
const { MapService } = require('../services');

const distanceCalculate = (request) => ({ distance: '2km' });

const getAddressFromLatLng = (request) => {
  const { params } = request;
  const { lat, lng } = params;
  return MapService.reverseGeocode(lat, lng);
};

module.exports = {
  distanceCalculate,
  getAddressFromLatLng,
};
