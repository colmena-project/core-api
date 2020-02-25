const { Parse } = global;

class Base extends Parse.Object {
  static async beforeSave(request) {
    const { user } = request;
    Object.keys(request.object.attributes).forEach((attribute) => {
      const value = request.object.get(attribute);
      if (typeof value === 'string') {
        request.object.set(attribute, value.trim());
      }
    });
    // Save blameable information
    if (request.object.isNew()) {
      if (user) request.object.set('createdBy', user);
    } else if (user) request.object.set('updatedBy', user);
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
