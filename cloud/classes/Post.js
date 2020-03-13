const Base = require('./Base');

class Post extends Base {
  constructor() {
    super(Post.prototype.constructor.name);
  }
}

module.exports = Post;
