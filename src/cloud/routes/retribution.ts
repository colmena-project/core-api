import { RetributionController } from '../controllers';

const routes: Colmena.RouteDefinitions = {
  estimateRetribution: {
    action: RetributionController.estimateRetribution,
    secure: true,
  },
};

export default routes;
