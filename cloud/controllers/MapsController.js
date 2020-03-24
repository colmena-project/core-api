/* eslint-disable no-unused-vars */
const { MapService } = require('../services');

const distanceCalculate = (request) => ({ distance: '2km' });

const getAddressFromLatLng = (request) => {
  const { params } = request;
  const { lat, lng } = params;
  return MapService.reverseGeocode(lat, lng);
};

const geocodeAddress = (request) => {
  const { params } = request;
  const { address } = params;
  return MapService.geocode(address);
};

const getAddressList = (request) => {
  const { params } = request;
  const { address } = params;
  return MapService.placeAutocomplete(address);
};

module.exports = {
  distanceCalculate,
  getAddressFromLatLng,
  geocodeAddress,
  getAddressList,
};
