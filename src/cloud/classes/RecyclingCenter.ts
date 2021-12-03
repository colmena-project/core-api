import Base from './Base';

class RecyclingCenter extends Base {
  constructor() {
    super(RecyclingCenter.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    return request.object;
  }
}

export default RecyclingCenter;
