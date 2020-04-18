import { getQueryAuthOptions } from '../src/cloud/utils';

let user: Parse.User;

beforeAll(() => {
  user = new Parse.User();
  user.getSessionToken = jest.fn().mockReturnValue('sessionString');
});

describe('Auth option tests', () => {
  test('Auth Options should be valid objects with session token', () => {
    const authOption = { sessionToken: 'sessionString', useMasterKey: false };
    expect(getQueryAuthOptions(user)).toStrictEqual(authOption);
    expect(getQueryAuthOptions(user, false)).toStrictEqual(authOption);
    expect(getQueryAuthOptions(user, undefined)).toStrictEqual(authOption);
  });

  test('Auth Options should be valid objects with master true', () => {
    const authOption = { useMasterKey: true };
    expect(getQueryAuthOptions(undefined, true)).toStrictEqual(authOption);
    expect(getQueryAuthOptions(user, true)).toStrictEqual(authOption);
  });

  test('Auth Options should be valid objects with master false', () => {
    const authOption = { useMasterKey: false };
    expect(getQueryAuthOptions(undefined, false)).toStrictEqual(authOption);
    expect(getQueryAuthOptions()).toStrictEqual(authOption);
  });
});
