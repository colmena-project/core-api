const { MapsController } = require('../controllers');

module.exports = {
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
};
