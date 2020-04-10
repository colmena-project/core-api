/* eslint-disable no-unused-vars */
/* @flow */

const { MapService } = require('../services');

const distanceCalculate = (request: Object) => ({ distance: '2km' });

const getAddressFromLatLng = (request: Object): Promise<Object> => {
  const { params } = request;
  const { lat, lng } = params;
  return MapService.reverseGeocode(lat, lng);
};

const geocodeAddress = (request: Object): Promise<Object> => {
  const { params } = request;
  const { address } = params;
  return MapService.geocode(address);
};

const getAddressList = (request: Object): Promise<Object> => {
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
