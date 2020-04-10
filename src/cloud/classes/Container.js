/* @flow */

const Base = require('./Base');

class Container extends Base {
  constructor() {
    super(Container.name);
  }
}

module.exports = Container;
