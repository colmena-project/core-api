import Base from './Base';

class RecyclingCenter extends Base {
  constructor() {
    super(RecyclingCenter.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    const recyclingCenter = request.object;

    const roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(true);
    roleACL.setPublicWriteAccess(true);
    const role: Parse.Role = new Parse.Role('ROLE_' + recyclingCenter.get('name'), roleACL);

    await role.save(null, {
      useMasterKey: true,
    });

    return request.object;
  }
}

export default RecyclingCenter;
