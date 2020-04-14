/* eslint-disable @typescript-eslint/no-unused-vars */

class Base extends Parse.Object {
  static beforeSave(request: Parse.Cloud.BeforeSaveRequest) {
    const { user, master } = request;
    Object.keys(request.object.attributes).forEach((attribute) => {
      const value = request.object.get(attribute);
      if (typeof value === 'string') {
        request.object.set(attribute, value.trim());
      }
    });

    if (user) {
      if (request.object.isNew()) {
        request.object.set('createdBy', user);
      } else {
        request.object.set('updatedBy', user);
      }
    }

    let acl: Parse.ACL | undefined;
    if (request.object.isNew()) {
      acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
    } else {
      acl = request.object.getACL();
    }

    // ensure read and write permissions to owner
    if (!master) {
      const createdBy: Parse.User = request.object.get('createdBy');
      if (createdBy && acl) {
        acl.setWriteAccess(createdBy.id, true);
        acl.setReadAccess(createdBy.id, true);
      }
    }
    if (acl) request.object.setACL(acl);
  }

  static afterSave(request: Parse.Cloud.AfterSaveRequest): any {
  }

  static beforeDelete(request: Parse.Cloud.BeforeDeleteRequest): any {
  }

  static afterDelete(request: Parse.Cloud.BeforeFindRequest): any {
  }

  static beforeFind(request: Parse.Cloud.BeforeFindRequest): any {
    const { query, master: isMaster } = request;
    if (!isMaster) query.doesNotExist('deletedAt');
    return request;
  }

  static afterFind(request: Parse.Cloud.AfterFindRequest): any {}
}

export default Base;
