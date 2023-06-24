import Axios from 'axios';
import { CRYPTOS_SYMBOL_TYPES } from '../constants';

const { Serialize } = require('eosjs');
const { TextEncoder, TextDecoder } = require('util');
const ecc = require('eosjs-ecc');

const CIRCULAR_API_KEY = process.env.CIRCULAR_API_KEY || 'not found';
const CIRCULAR_BASE_URL = process.env.CIRCULAR_BASE_URL || 'http://not.found';

interface Balance {
  accountName: string;
  balance: number;
  lastSeqNum: number;
}

const getBalance = async (account: string): Promise<Balance> => {
  const response: Balance = await Axios.get(
    `${CIRCULAR_BASE_URL}${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/users/${account}`,
    {
      headers: {
        authorization: `Bearer ${CIRCULAR_API_KEY}`,
      },
    },
  ).then((res) => ({
    accountName: res.data.result.account_name,
    balance: parseFloat(res.data.result.balance),
    lastSeqNum: res.data.result.last_seq_num,
  }));
  return response;
};

const transferPayment = async ({
  accountFrom,
  accountTo,
  amount,
  reason,
  privkey,
}: {
  accountFrom: string;
  accountTo: string;
  amount: number;
  reason?: string;
  privkey: string;
}): Promise<boolean> => {
  try {
    const formatAmount = (Math.round(amount * 100) / 100).toFixed(2);
    const { balance, lastSeqNum } = await getBalance(accountFrom);
    if (balance < amount) {
      throw new Error('Insufficient funds');
    }

    const sb = new Serialize.SerialBuffer({
      textDecoder: new TextDecoder('utf-8', { fatal: true }),
      textEncoder: new TextEncoder(),
    });

    sb.pushName(accountFrom);
    sb.pushName(accountTo);
    sb.pushAsset(`${formatAmount} ${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}`);
    sb.pushString(reason);
    sb.pushNumberAsUint64(lastSeqNum);
    sb.pushNumberAsUint64(1);

    const buff = Buffer.from(sb.asUint8Array());
    const signature = ecc.sign(buff, privkey);

    await Axios.post(`${CIRCULAR_BASE_URL}${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/transfer`, {
      from: accountFrom,
      to: accountTo,
      amount: `${formatAmount} ${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}`,
      signature,
      account_type: 'INTERNAL',
      memo: reason,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((res) => res);
    return true;
  } catch (err) {
    return false;
  }
};

interface CreateWallet {
  id: string | null;
  token: string | null;
  error?: string | null;
}

const createWallet = async (
  firstName: string,
  lastName: string,
  email: string,
): Promise<CreateWallet> => {
  const publicKey = await ecc.randomKey().then((key: string) => ecc.privateToPublic(key));

  return Axios.post(`${CIRCULAR_BASE_URL}${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/users`, {
    pubkey: publicKey,
    data: {
      name: firstName,
      lastname: lastName,
      email,
    },
  })
    .then((res) => ({
      id: res.data.userid,
      token: publicKey,
    }))
    .catch((error) => ({ id: null, token: null, error: error.message }));
};

const refreshToken = async (walletId: string): Promise<{ status: boolean; message: string }> => {
  const response = await Axios.get(
    `${CIRCULAR_BASE_URL}${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/users/${walletId}/changekey`,
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  )
    .then(() => ({ status: true, message: 'success' }))
    .catch((err) => {
      if (err.response.data.error) {
        return { status: false, message: err.response.data.error };
      }
      return { status: false, message: err.message };
    });
  return response;
};

const confirmNewToken = async (
  walletId: string,
  securityCode: string,
): Promise<{ status: boolean; message: string; privateKey?: string }> => {
  let privateKey = '';
  let publicKey = '';
  await ecc.randomKey().then((tokenTtemp: string) => {
    privateKey = tokenTtemp;
    publicKey = ecc.privateToPublic(privateKey);
  });

  const response = await Axios.post(
    `${CIRCULAR_BASE_URL}${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/users/${walletId}/changekey`,
    {
      pubkey: publicKey,
      account: walletId,
      code: securityCode,
    },
  )
    .then((res) => ({
      status: true,
      message: 'success',
      data: res.data.result,
      privateKey,
    }))
    .catch((err) => ({ status: false, message: err.message }));
  return response;
};

export default {
  getBalance,
  transferPayment,
  createWallet,
  refreshToken,
  confirmNewToken,
};
