import { DefaultController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  ping: {
    action: DefaultController.ping,
    secure: false,
  },
  testMail: {
    action: DefaultController.testMail,
    secure: true,
  },
};

export default definitions;
