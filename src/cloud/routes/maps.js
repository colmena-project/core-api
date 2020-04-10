/* @flow */
import type { RouteDefinitions } from '../../flow-types';

const { MapsController } = require('../controllers');

const definitions: RouteDefinitions = {
  distanceCalculate: {
    action: MapsController.distanceCalculate,
    secure: false,
  },
  getAddress: {
    action: MapsController.getAddressFromLatLng,
    secure: true,
  },
  geocodeAddress: {
    action: MapsController.geocodeAddress,
    secure: true,
  },
  getAddressList: {
    action: MapsController.getAddressList,
    secure: true,
  },
};

module.exports = definitions;
