declare namespace Colmena {
  type TransactionTypesType =
    | 'RECOVER'
    | 'DELETE_CONTAINERS'
    | 'TRANSFER_REQUEST'
    | 'TRANSFER_ACCEPT'
    | 'TRANSFER_REJECT'
    | 'TRANSFER_CANCEL'
    | 'TRANSPORT'
    | 'TRANSPORT_CANCEL'
    | 'TRANSPORT_ACCEPT'
    | 'TRANSPORT_REJECT'
    | 'PAID'
    | 'REJECT';

  type ContainerStatusType =
    | 'RECOVERED'
    | 'DELETED'
    | 'TRANSFER_PENDING'
    | 'TRANSFER_REJECTED'
    | 'TRANSFERRED'
    | 'IN_TRANSIT'
    | 'IN_PROCESS'
    | 'COMPLETED';

  type NotificationTypesType =
    | 'TRANSFER_REQUEST'
    | 'TRANSFER_ACCEPT'
    | 'TRANSFER_REJECT'
    | 'TRANSFER_CANCEL'
    | 'TRANSPORT';

  interface SecureFunctionRequest extends Parse.Cloud.FunctionRequest {
    user: Parse.User;
  }

  type SecureCloudFunction = (request: SecureFunctionRequest) => any;

  type CloudFunction = (request: Parse.Cloud.FunctionRequest) => any;

  type RouteDefinition = {
    action: CloudFunction | SecureCloudFunction;
    secure: boolean;
  };

  type RouteDefinitions = {
    [key: string]: RouteDefinition;
  };

  type WasteTypeType = {
    name: string;
    description: number;
    qty: number;
    unit: string;
    code: string;
    container: string;
    containerPlural: string;
  };

  type ContainerType = {
    type: Parse.Object;
    status: ContainerStatusType;
    number?: number;
    code?: string;
  };

  type UserType = {
    username: String;
    email: number;
    password?: string;
    emailVerified: number;
  };

  type TransactionType = {
    from: Parse.User | void;
    to: Parse.User | void;
    type: TransactionTypesType;
    number?: number;
    relatedTo: TransactionType | void;
    fromAddress: Object | void;
    toAddress: Object | void;
    reason: string | void;
    recyclingCenter: Parse.Object | void;
    kms?: number | void;
    estimatedDuration?: Object | void;
    estimatedDistance?: Object | void;
    trackingCode?: number;
  };

  type ContainerInputType = {
    qty: number;
    typeId: string;
  };

  type MailType = {
    to: string;
    subject: string;
    text: string;
    html: string;
    templateId: string;
    dynamic_template_data: {};
  };

  type NotificationDataType = {
    type: NotificationTypesType;
    message: string;
    data: Object;
  };

  type AccountType = {
    username: string;
    email: string;
    password: string;
    firstName: string;
    middleName: string;
    lastName: string;
    nickname: string;
    facebook: string;
    facebookProfilePhotoUrl: string;
    aboutMe: string;
    fbAuthData: Parse.AuthData | undefined;
    address?: AddressType;
    walletId: string;
  };

  type AccountUserType = {
    username: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    nickname?: string;
    facebook?: string;
    facebookProfilePhotoUrl?: string;
    aboutMe: string;
    fbAuthData?: Parse.AuthData | undefined;
    walletId?: string;
    user: Parse.User;
  };

  type AddressType = {
    city: string;
    account: Parse.Object;
    state: string;
    country: string;
    description: string;
    street: string;
    latLng: Parse.GeoPoint;
  };

  // type FlatAddress = {
  //   latLng: Parse.GeoPoint,
  //   [key: string]: any,
  // };

  type Material = {
    wasteType: String;
    qty: number;
    unit: string;
  };

  type RoleType = {
    id?: string;
    name: string;
    users?: string[];
    roles?: string[];
  };

  type RecyclingCenterType = {
    id?: string;
    name: string;
    description?: string;
    latLng?: Parse.GeoPoint;
  };
}
