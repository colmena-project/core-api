import Axios from 'axios';
import { CRYPTOS_SYMBOL_TYPES } from '../constants';

const { Serialize } = require('eosjs');
const { TextEncoder, TextDecoder } = require('util');
const ecc = require('eosjs-ecc');

const CIRCULAR_API_KEY = process.env.CIRCULAR_API_KEY || 'not found';

interface Balance {
  accountName: string;
  balance: number;
  lastSeqNum: number;
}

const getBalance = async (account: string): Promise<Balance> => {
  const response: Balance = await Axios.get(
    `http://api.sandbox.circularnetwork.io/v1/project/${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/users/${account}`,
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
  motive,
  privkey,
}: {
  accountFrom: string;
  accountTo: string;
  amount: number;
  motive?: string;
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
    sb.pushString(motive);
    sb.pushNumberAsUint64(lastSeqNum);
    sb.pushNumberAsUint64(1);

    const buff = Buffer.from(sb.asUint8Array());
    const signature = ecc.sign(buff, privkey);

    await Axios.post(
      `http://api.sandbox.circularnetwork.io/v1/project/${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}/transfer`,
      {
        from: accountFrom,
        to: accountTo,
        amount: `${formatAmount} ${CRYPTOS_SYMBOL_TYPES.JELLYCOIN}`,
        signature,
        account_type: 'INTERNAL',
        memo: motive,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    ).then((res) => res);
    return true;
  } catch (err) {
    return false;
  }
};

export { getBalance, transferPayment };
