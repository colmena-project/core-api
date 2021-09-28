// import { RoleService } from '../services';
import Base from './Base';

class RecyclingCenter extends Base {
  constructor() {
    super(RecyclingCenter.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    // const recyclingCenter = request.object;

    // const nameNormalize = 'ROLE_RC_' + RoleService.normalizeNameRole(recyclingCenter.get('name'));

    // const roleACL = new Parse.ACL();
    // roleACL.setPublicReadAccess(true);
    // roleACL.setPublicWriteAccess(true);
    // let role: Parse.Role = await RoleService.findByName(nameNormalize)
    // role: Parse.Role = new Parse.Role(nameNormalize, roleACL);
    // await role.save(null, {
    //   useMasterKey: true,
    // });
    // request.object.set('role', role);

    return request.object;
  }
}

export default RecyclingCenter;
