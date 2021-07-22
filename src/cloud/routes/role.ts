import { RoleController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  createRole: {
    action: RoleController.createRole,
    secure: true,
  },

  editRole:{
    action: RoleController.editRole,
    secure: true,
  }
  
};

export default definitions;
