import Base from './Base';
import { UserService } from '../services';

class Account extends Base {
  constructor() {
    super(Account.name);
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

export default Account;
