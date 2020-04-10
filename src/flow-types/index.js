// @flow
export type AuthOptionsType = {
  useMasterKey: boolean,
  sessionToken?: ?string,
};

export type TransactionTypesType =
  | 'RECOVER'
  | 'DELETE_RECOVER'
  | 'TRANSFER_REQUEST'
  | 'TRANSFER_ACCEPT'
  | 'TRANSFER_REJECT'
  | 'TRANSFER_CANCEL'
  | 'TRANSPORT';

export type ContainerStatusType =
  | 'RECOVERED'
  | 'DELETED'
  | 'TRANSFER_PENDING'
  | 'TRANSFER_REJECTED'
  | 'TRANSFERRED'
  | 'IN_TRANSIT'
  | 'IN_PROCESS'
  | 'COMPLETED';

export type NotificationTypesType =
  | 'TRANSFER_REQUEST'
  | 'TRANSFER_ACCEPT'
  | 'TRANSFER_REJECT'
  | 'TRANSFER_CANCEL'
  | 'TRANSPORT';

export type RouteDefinition = {
  action: Function,
  secure: boolean,
};

export type RouteDefinitions = {
  [string]: RouteDefinition,
};

export interface ParseObject {
  id: string;
  get(attr: string): any;
  set(attr: string | Object, value?: any): ParseObject | boolean;
  destroy(options: AuthOptionsType): Promise<any>;
  increment(attr: string, number: number): any;
  setACL(acl: any): any;
  save(options?: Object, authOptions?: AuthOptionsType): Promise<any>;
  toJSON(): Object;
  toPointer(): Object;
  equals(obj: ParseObject): boolean;
}

export interface ParseUser extends ParseObject {
  getSessionToken(): string;
  _isLinked(provider: string): boolean;
  _linkWith(provider: string, { authData: Object }, authOptions?: AuthOptionsType): Promise<any>;
}

export type WasteTypeType = {
  name: string,
  description: number,
  qty: number,
  unit: string,
  code: string,
  container: string,
  containerPlural: string,
};

export type ContainerType = {
  type: ParseObject,
  status: ContainerStatusType,
  number?: number,
  code?: string,
};

export type UserType = {
  username: String,
  email: number,
  emailVerified: number,
};

export type TransactionType = {
  from: ?ParseUser,
  to: ?ParseUser,
  type: TransactionTypesType,
  number?: number,
  relatedTo: ?TransactionType,
  fromAddress: ?Object,
  toAddress: ?Object,
  reason: ?string,
  recyclingCenter: ?ParseObject,
};

export type ContainerInputType = {
  qty: number,
  typeId: string,
};

export type MailType = {
  to: string,
  subject: string,
  text: string,
  html: string,
  templateId: string,
  dynamic_template_data: {},
};

export type NotificationDataType = {
  type: NotificationTypesType,
  message: string,
  data: Object,
};

export type AccountType = {
  username: string,
  email: string,
  password: string,
  firstName: string,
  middleName: string,
  lastName: string,
  nickname: string,
  facebook: string,
  facebookProfilePhotoUrl: string,
  aboutMe: string,
  fbAuthData: string,
};

export type AddressType = {
  city: string,
  account: ParseObject,
  state: string,
  country: string,
  description: string,
};
