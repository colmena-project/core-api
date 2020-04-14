export const MAX_CONTAINERS_QUANTITY_PER_REQUEST = 20;
export enum TRANSACTIONS_TYPES {
  RECOVER='RECOVER',
  DELETE_RECOVER='DELETE_RECOVER',
  TRANSFER_REQUEST='TRANSFER_REQUEST',
  TRANSFER_ACCEPT='TRANSFER_ACCEPT',
  TRANSFER_REJECT='TRANSFER_REJECT',
  TRANSFER_CANCEL='TRANSFER_CANCEL',
  TRANSPORT='TRANSPORT', // TODO
  PROCESS='PROCESS', // TODO
  COMPLETE='COMPLETE', // TODO
}

export enum CONTAINER_STATUS {
  RECOVERED='RECOVERED',
  DELETED='DELETED',
  TRANSFER_PENDING='TRANSFER_PENDING',
  TRANSFER_REJECTED='TRANSFER_REJECTED', // not neccesary
  TRANSFERRED='TRANSFERRED',
  IN_TRANSIT='IN_TRANSIT',
  IN_PROCESS='IN_PROCESS',
  COMPLETED='COMPLETED',
}
export enum NOTIFICATION_TYPES {
  TRANSFER_REQUEST='TRANSFER_REQUEST',
  TRANSFER_ACCEPT='TRANSFER_ACCEPT',
  TRANSFER_REJECT='TRANSFER_REJECT',
  TRANSFER_CANCEL='TRANSFER_CANCEL',
  TRANSPORT='TRANSPORT',
}
