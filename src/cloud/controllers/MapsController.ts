/* eslint-disable @typescript-eslint/no-unused-vars */
import { MapService } from '../services';

const distanceCalculate = (request: Parse.Cloud.FunctionRequest) => ({ distance: '2km' });

const getAddressFromLatLng = (request: Parse.Cloud.FunctionRequest): Promise<Object> => {
  const { params } = request;
  const { lat, lng } = params;
  return MapService.reverseGeocode(lat, lng);
};

const geocodeAddress = (request: Parse.Cloud.FunctionRequest): Promise<Object> => {
  const { params } = request;
  const { address } = params;
  return MapService.geocode(address);
};

const getAddressList = (request: Parse.Cloud.FunctionRequest): Promise<Object> => {
  const { params } = request;
  const { address } = params;
  return MapService.placeAutocomplete(address);
};

export default {
  distanceCalculate,
  getAddressFromLatLng,
  geocodeAddress,
  getAddressList,
};
