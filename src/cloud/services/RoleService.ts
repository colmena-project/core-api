const createRole  = async (params: Colmena.RoleType): Promise<Parse.Object> => {
  const {
    name,
    users,
    roles,
  } = params;
  const roleACL = new Parse.ACL();
  roleACL.setPublicReadAccess(true);
  roleACL.setPublicWriteAccess(true);
  const role: Parse.Role = new Parse.Role(name,roleACL);

  users !== undefined && users.map(idUser => {
    const usersToAddToRole = new Parse.User();
    usersToAddToRole.id = idUser;
    role.getUsers().add(usersToAddToRole);
  });

  roles !== undefined && roles.map( async (idRole) => {
    const query = new Parse.Query(Parse.Role);
    query.equalTo("objectId", idRole);
    const roleToAddToRole =  await query.first({ useMasterKey: true });
    (roleToAddToRole !== undefined) && role.getRoles().add(roleToAddToRole);
  });
 

  await role.save(null, 
    { 
      useMasterKey: true,
    });
  return role;
};

const updateRole  = async (params: Colmena.RoleType): Promise<Parse.Object> => {
  const {
    id,
    name,
    users,
    roles,
  } = params;
  
  const query = new Parse.Query(Parse.Role);
  query.equalTo("objectId", id);
  const role =  await query.first({ useMasterKey: true });
  if(role === undefined){
    throw new Error('The Role is not found');
  }else{

    let usersRole = await role.getUsers().query().find();

    users !== undefined && users.map(idUser => {
      const usersToAddToRole = new Parse.User();
      usersToAddToRole.id = idUser;
      role.getUsers().add(usersToAddToRole);

      usersRole = usersRole.filter( (value) => { 
        return value.id !== idUser;
     });
    });

    usersRole.map((user) => {
      role.getUsers().remove(user)
    });
    

    let rolesRole = await role.getRoles().query().find();
    roles !== undefined && roles.map( async (idRole) => {
      const query = new Parse.Query(Parse.Role);
      query.equalTo("objectId", idRole);
      const roleToAddToRole =  await query.first({ useMasterKey: true });
      (roleToAddToRole !== undefined) && role.getRoles().add(roleToAddToRole);
      
      rolesRole = rolesRole.filter( (value) => { 
        return value.id !== idRole;
      });
    });

    rolesRole.map((roleRemove) => {
      role.getRoles().remove(roleRemove)
    });
  
    await role.save({"name":name}, 
      { 
        useMasterKey: true,
      });
    return role;
    
  }
};


export default {
  createRole,
  updateRole
};
