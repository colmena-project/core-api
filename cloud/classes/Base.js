const { Parse } = global;

class Base extends Parse.Object {
  static async beforeSave(request) {
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

    let acl;
    if (request.object.isNew()) {
      acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
    } else {
      acl = request.object.getACL();
    }
    if (!master && user) {
      acl.setWriteAccess(user, true);
      acl.setReadAccess(user, true);
    }
    request.object.setACL(acl);
  }

  static afterSave() {}

  static beforeDelete() {}

  static afterDelete() {}

  static beforeFind(request) {
    const { query, master: isMaster } = request;
    if (!isMaster) query.doesNotExist('deletedAt');
  }

  static afterFind() {}
}

module.exports = Base;
