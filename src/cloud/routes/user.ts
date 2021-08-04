import { UserController } from '../controllers';

const definitions: Colmena.RouteDefinitions = {
    
    findUser:{
        action: UserController.findUserAdmin,
        secure: true,
    },
    findUserBy:{
        action: UserController.adminFindUserBy,
        secure: true,
    },

    findUserById:{
        action: UserController.adminFindUserById,
        secure: true,
    },

    createUserAdmin:{
        action: UserController.createUserAdmin,
        secure: true,
    },

    udpdateUserAdmin:{
        action: UserController.udpdateUserAdmin,
        secure: true,
    },

};

export default definitions;
