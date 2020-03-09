const { MapsController } = require('../controllers');

module.exports = {
  distanceCalculate: {
    action: MapsController.distanceCalculate,
    secure: false,
  },
};
