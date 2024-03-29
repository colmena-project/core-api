import { getQueryAuthOptions } from '../utils';
import Address from '../classes/Address';
import Account from '../classes/Account';
import MailService from './MailService';
import { getConfig } from '../utils/core';

const findAccountByUser = async (user: Parse.User): Promise<Parse.Object> => {
  const query = new Parse.Query('Account');
  query.equalTo('user', user);
  const account = await query.first({ useMasterKey: true });
  if (!account) throw new Error(`Account for user ${user.id} not found`);
  return account;
};

const buildEmailLink = (destination:string, username:string, token:string, config:any): string => {
  const usernameAndToken = `token=${token}&username=${username}`;

  if (config.parseFrameURL) {
    const destinationWithoutHost = destination.replace(config.publicServerURL, '');

    return `${config.parseFrameURL}?link=${encodeURIComponent(
      destinationWithoutHost
    )}&${usernameAndToken}`;
  } else {
    return `${destination}?${usernameAndToken}`;
  }
}

const createAccount = async (params: Colmena.AccountType): Promise<Parse.Object> => {
  const {
    username,
    email,
    password,
    firstName,
    middleName,
    lastName,
    nickname,
    facebook,
    facebookProfilePhotoUrl,
    aboutMe,
    fbAuthData,
    address,
    walletId,
  } = params;
  const user: Parse.User = new Parse.User();
  user.set('username', username);
  user.set('password', password);
  user.set('email', email);
  await user.save();
  // eslint-disable-next-line no-underscore-dangle
  if (fbAuthData && !user._isLinked('facebook')) {
    await user.linkWith('facebook', { authData: fbAuthData }, { useMasterKey: true });
  }

  const newAccount = await createAccountWithUser({
    username,
    firstName,
    middleName,
    lastName,
    nickname,
    facebook,
    facebookProfilePhotoUrl,
    aboutMe,
    walletId,
    user,
  });

  if (address) {
    const { street, city, state, country, description, latLng } = address;
    const newAddress = new Address();
    newAddress.set('street', street);
    newAddress.set('city', city);
    newAddress.set('state', state);
    newAddress.set('country', country);
    newAddress.set('description', description);
    newAddress.set('latLng', latLng);
    newAddress.set('default', true);
    newAddress.set('createdBy', user);
    newAddress.set('account', newAccount);
    await newAddress.save(null, { useMasterKey: true });
    newAddress.setACL(new Parse.ACL(user));
    await newAddress.save(null, { useMasterKey: true });
  }

  // Find the user with admin role
  const queryUser: Parse.Query = new Parse.Query('_User');
  queryUser.equalTo('objectId', user.id);
  const userMaster = await queryUser.first({
    useMasterKey: true,
  });

  //create a verification link
  //@ts-ignore
  const token = encodeURIComponent(userMaster.get('_email_verify_token'));
  const config = getConfig();
  const link = buildEmailLink(config.verifyEmailURL, username, token, config);

    
  const mailParams = {
    name: `${newAccount.get('firstName')} ${newAccount.get('lastName')}`,
    username: user.get('username'),
    to: user.get('email'),
    subject: 'New Colmena Account created',
    link,
  };
  await MailService.sendNewAccountCreated(mailParams);

  return newAccount;
};

const createAccountWithUser = async (params: Colmena.AccountUserType): Promise<Parse.Object> => {
  const {
    username,
    firstName,
    middleName,
    lastName,
    nickname,
    facebook,
    facebookProfilePhotoUrl,
    aboutMe,
    walletId,
    user,
  } = params;
  const newAccount: Parse.Object = new Account();
  newAccount.set('firstName', firstName);
  newAccount.set('middleName', middleName);
  newAccount.set('lastName', lastName);
  newAccount.set('nickname', nickname || username);
  newAccount.set('facebook', facebook);
  newAccount.set('facebookProfilePhotoUrl', facebookProfilePhotoUrl);
  newAccount.set('aboutMe', aboutMe);
  newAccount.set('user', user);
  newAccount.set('createdBy', user.toPointer());
  newAccount.set('updatedBy', user.toPointer());
  newAccount.set('walletId', walletId);

  const acl: Parse.ACL = new Parse.ACL();
  acl.setPublicReadAccess(true);
  acl.setPublicWriteAccess(false);
  acl.setWriteAccess(user, true);
  acl.setReadAccess(user, true);
  newAccount.setACL(acl);

  await newAccount.save();

  return newAccount;
};

const findAccountById = async (accountId: string): Promise<Object> => {
  if (!accountId) throw new Error('Account Not Found');
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(undefined, true);
  const accountQuery: Parse.Query = new Parse.Query('Account');
  const account: Parse.Object = await accountQuery.get(accountId, authOptions);
  // TODO: clean private account data.
  // Resume data to send to client
  return {
    account,
    activityFeed: [],
    rewards: [],
  };
};

const removeDefaultFromOtherAddresses = async (
  address: Parse.Object,
  user: Parse.User,
): Promise<Parse.Object[]> => {
  const query = new Parse.Query('Address');
  query.notEqualTo('objectId', address.id);
  const adresses: Parse.Object[] = await query.find({ sessionToken: user.getSessionToken() });
  return Promise.all(
    adresses.map((a) => {
      a.set('default', false);
      return a.save(null, { useMasterKey: false, sessionToken: user.getSessionToken() });
    }),
  );
};

const findAccountAddress = async (account: Parse.Object): Promise<Parse.Object[]> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(undefined, true);
  const query = new Parse.Query('Address');
  query.equalTo('account', account);
  const addresses: Parse.Object[] = await query.find(authOptions);
  return addresses;
};

const findDefaultAddress = async (account: Parse.Object): Promise<Parse.Object> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(undefined, true);
  const query: Parse.Query = new Parse.Query('Address');
  query.equalTo('account', account);
  query.equalTo('default', true);
  const address: Parse.Object | void = await query.first(authOptions);
  if (!address) throw new Error(`Cannot find default Address for account ${account.id}`);
  return address;
};

const findAccountAddressById = async (addressId: string): Promise<Parse.Object> => {
  try {
    const authOptions: Parse.ScopeOptions = getQueryAuthOptions(undefined, true);
    const query = new Parse.Query('Address');
    const address: Parse.Object = await query.get(addressId, authOptions);
    return address;
  } catch (error) {
    throw new Error(`Address id '${addressId}' not found`);
  }
};

const addNewAddress = async (
  attributes: Colmena.AddressType,
  user: Parse.User,
): Promise<Parse.Object> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, false);
  const address: Parse.Object = new Address();
  const account = await findAccountByUser(user);
  address.set({ ...attributes, account });
  await address.save(null, authOptions);
  if (address.get('default')) {
    await removeDefaultFromOtherAddresses(address, user);
  }
  return address;
};

const editAddress = async (
  addresId: string,
  attributes: Colmena.AddressType,
  user: Parse.User,
): Promise<Parse.Object> => {
  const authOptions: Parse.ScopeOptions = getQueryAuthOptions(user, false);
  const query: Parse.Query = new Parse.Query('Address');
  const address: Parse.Object = await query.get(addresId, { sessionToken: user.getSessionToken() });
  address.set({ ...attributes });
  await address.save(null, authOptions);
  if (address.get('default')) {
    await removeDefaultFromOtherAddresses(address, user);
  }

  return address;
};

export default {
  findAccountByUser,
  createAccount,
  createAccountWithUser,
  findAccountById,
  addNewAddress,
  editAddress,
  findAccountAddress,
  findAccountAddressById,
  findDefaultAddress,
};
