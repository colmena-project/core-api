/* @flow */
const Base = require('./Base');

class Address extends Base {
  constructor() {
    super(Address.prototype.constructor.name);
  }
}

module.exports = Address;
