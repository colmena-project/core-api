import Base from './Base';
import AccountService from '../services/AccountService';

class Post extends Base {
  constructor() {
    super(Post.name);
  }

  static async beforeSave(request: Parse.Cloud.BeforeSaveRequest): Promise<any> {
    const { object: post } = request;
    super.beforeSave(request);
    const postACL = post.getACL();
    if (postACL) {
      postACL.setPublicReadAccess(true);
      post.setACL(postACL);
    }
  }

  static async afterSave(request: Parse.Cloud.AfterSaveRequest): Promise<Parse.Object> {
    const { object: post } = <{ object: Post }>(<unknown>request);
    const account = await post.getOwnerAccount();
    if (account) {
      const nickname = account.get('nickname');
      post.set('nickname', nickname);
    }
    return post;
  }

  static async afterFind(request: Parse.Cloud.AfterFindRequest): Promise<any> {
    const { objects: posts } = <{ objects: Post[] }>(<unknown>request);
    const postPromisses = posts.map((post: Post) => post.getOwnerAccount());

    const ownersAccount = await Promise.all(postPromisses);
    ownersAccount.forEach((account: Parse.Object | undefined, index: number) => {
      if (account) {
        const nickname: string = account.get('nickname');
        posts[index].set('nickname', nickname);
      }
    });

    return posts;
  }

  async getOwnerAccount(): Promise<Parse.Object | undefined> {
    const createdBy = this.get('createdBy');
    if (!createdBy) return undefined;
    const account = await AccountService.findAccountByUser(createdBy);
    return account;
  }
}

export default Post;
