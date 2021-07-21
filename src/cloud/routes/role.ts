import { RoleController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
  createRole: {
    action: RoleController.createRole,
    secure: false,
  },

  editRole:{
    action: RoleController.editRole,
    secure: false,
  }
  
};

export default definitions;
