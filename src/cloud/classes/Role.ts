import Base from './Base';

class Role extends Base {
  constructor() {
    super(Role.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    return request.object;
  }
}

export default Role;
