const { DefaultController } = require('../controllers');

module.exports = {
  ping: {
    action: DefaultController.ping,
    secure: false,
  },
  testMail: {
    action: DefaultController.testMail,
    secure: true,
  },
};
