import Base from './Base';
import UserService from '../services/UserService';

class Role extends Base {
  constructor() {
    super(Role.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    return request.object;
  }

  static async afterDelete(request: Parse.Cloud.AfterDeleteRequest): Promise<any> {
    const account = request.object;
    const user = account.get('user');
    await UserService.clearUserSessions(user);
    user.destroy({ useMasterKey: true });
  }
}

export default Role;
