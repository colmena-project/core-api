import { RecyclingCenterController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  findRecyclingCenterById: {
    action: RecyclingCenterController.findRecyclingCenterById,
    secure: true,
  },
  createRecyclingCenter: {
    action: RecyclingCenterController.createRecyclingCenter,
    secure: true,
  },
  editRecyclingCenter: {
    action: RecyclingCenterController.editRecyclingCenter,
    secure: true,
  },
  deleteRecyclingCenter: {
    action: RecyclingCenterController.deleteRecyclingCenter,
    secure: true,
  },
};

export default definitions;
