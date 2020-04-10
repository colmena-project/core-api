/* @flow */

const Base = require('./Base');
const AccountService = require('../services/AccountService');

class Post extends Base {
  constructor() {
    super(Post.name);
  }

  static async beforeSave(request: Object): Promise<any> {
    const { object: post } = request;
    super.beforeSave(request);
    const postACL = post.getACL();
    postACL.setPublicReadAccess(true);
    post.setACL(postACL);
  }

  static async afterSave(request: Object): Promise<any> {
    const { object } = request;
    const account = await object.getOwnerAccount();
    if (account) {
      const nickname = account.get('nickname');
      object.set('nickname', nickname);
    }
    return object;
  }

  static async afterFind(request: Object): Promise<any> {
    const { objects: posts } = request;
    const postPromisses = posts.map((post) => post.getOwnerAccount());

    const ownersAccount = await Promise.all(postPromisses);
    ownersAccount.forEach((account, index) => {
      if (account) {
        const nickname = account.get('nickname');
        posts[index].set('nickname', nickname);
      }
    });

    return posts;
  }

  async getOwnerAccount() {
    const createdBy = this.get('createdBy');
    const account = await AccountService.findAccountByUser(createdBy);
    return account;
  }
}

module.exports = Post;
