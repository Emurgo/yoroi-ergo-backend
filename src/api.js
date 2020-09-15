// @flow
const config = require('config');
const fetch = require('node-fetch');
const utils = require('./utils');
const BigNumber = require('bignumber.js');

import type {
  UtxoForAddressesInput,
  UtxoForAddressesOutput,
  UtxoSumForAddressesInput,
  UtxoSumForAddressesOutput,
  FilterUsedInput,
  FilterUsedOutput,
  TxBodiesInput,
  HistoryInput,
  HistoryOutput,
  StatusOutput,
} from './types/wrapperApi';
import type {
  HandlerFunction,
  UtilEither,
  UtilOK,
} from './types/utils';
import type {
  getApiV0BlocksP1SuccessResponse,
  getApiV0AddressesP1TransactionsSuccessResponse,
  getApiV0AddressesP1TransactionsItem,
  getApiV0BlocksSuccessResponse,
  postApiV0TransactionsSendSuccessResponse,
  postApiV0TransactionsSendRequest,
  getApiV0TransactionsP1SuccessResponse,
  getApiV0AddressesP1SuccessResponse,
} from './types/explorer';

const addressesRequestLimit = 50;
const apiResponseLimit = 50;

const askBlockNum = async (blockHash: string, txHash?: string): Promise<UtilEither<number>> => {
  if (blockHash == undefined) return {kind:'ok', value: -1};

  const resp = await fetch(
    `${config.backend.explorer}/api/v0/blocks/${blockHash}`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: 'after block not found.'};

  const r: getApiV0BlocksP1SuccessResponse = await resp.json();

  if (txHash === "" || txHash == undefined) {
    return {kind:'ok', value: r.block.header.height};
  }

  for(const tx of r.block.blockTransactions) {
      if (tx.id === txHash) {
        return {kind: 'ok', value: r.block.header.height};
      }
  }

  return {kind:'error', errMsg: 'after tx not found.'};
}

const getCreationHeight: getApiV0AddressesP1TransactionsItem => number = (item) => {
  // recall: Ergo requires at least one output per transaction
  return item.outputs[0].creationHeight;
}

const askTransactionHistory = async (
    limit: number
    , addresses: string[]
    , afterNum: number
    , afterTxHash: ?string
    , untilNum: number
  ) : Promise<UtilEither<Array<getApiV0AddressesP1TransactionsItem>>> => {

  let output: Array<getApiV0AddressesP1TransactionsItem> = [];

  const responses =  await Promise.all(addresses.map((address) => (
      fetch(`${config.backend.explorer}/api/v0/addresses/${address}/transactions`)
  )));

  const unfilteredResponses: Array<getApiV0AddressesP1TransactionsItem> = [];
  for (const response of responses) {
    if (response.status !== 200) return {kind:'error', errMsg: `error querying transactions for address`};
    const json: getApiV0AddressesP1TransactionsSuccessResponse = await response.json();
    unfilteredResponses.push(...json.items);
  }

  if (unfilteredResponses.length == 0) return {
    kind: 'ok',
    value: [],
  };

  for(const response of unfilteredResponses) {
    // filter by limit after and until
    const creationHeight = getCreationHeight(response);
    if (creationHeight <= afterNum) {
      continue;
    }
    if (creationHeight > untilNum) {
      continue;
    }
    output.push(response);
  }

  if (afterTxHash != undefined) {
    const index = output
      .findIndex((tx) => (tx.id === afterTxHash))
    if (index != undefined) {
      output = output.slice(index + 1)
    }
  }

  return {
    kind: 'ok',
    value: output,
  };
}

const bestBlock: HandlerFunction = async function (req, _res) {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/blocks`
  );

  if (resp.status !== 200) {
    return {status: 400, body: `error getting bestBlock`};
  }
  const r: getApiV0BlocksSuccessResponse = await resp.json();
  const output = {
    epoch: 0, // TODO
    slot: 0, // TODO
    hash: r.items[0].id,
    height: r.items[0].height,
  };

  return { status: 200, body: output };
};

const signed: HandlerFunction = async function (req, _res) {
  const body: postApiV0TransactionsSendRequest = req.body;

  const resp = await fetch(
      `${config.backend.explorer}/api/v0/transactions/send`,
      {
        method: 'post',
        body,
      })

  if (resp.status !== 200) {
    return { status: 400, body: `error sending transaction`};
  }
  const r: postApiV0TransactionsSendSuccessResponse = await resp.json();
  return { status: 200, body: r };
};

async function getUtxoForAddress(address: string): Promise<UtilEither<UtxoForAddressesOutput>> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}/transactions`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: `error querying utxos for address`};
  const r: getApiV0AddressesP1TransactionsSuccessResponse = await resp.json();

  // Get all outputs whose `address` matches input address and `spentTransactionId` is `null`.
  const result = r.items.map(({ outputs }) => (
    outputs
      .map((output, index) => ({ output, index }))
      .filter(({ output, index }) =>
        output.address === address && output.spentTransactionId === null
      )
  ))
  .flat()
  .map(({ output, index }) => ({
     tx_hash: output.id,
     tx_index: index,
     utxo_id: output.id + index,
     receiver: address,
     amount: String(output.value)
  }));

  return {
    kind: 'ok',
    value: result,
  };
}


const utxoForAddresses: HandlerFunction = async function (req, _res) {
  const input: UtxoForAddressesInput = req.body;
  
  const outputsForAddresses: Array<UtilEither<UtxoForAddressesOutput>> = (await Promise.all(
    input.addresses.map(getUtxoForAddress)
  ));

  const result: UtxoForAddressesOutput = [];
  for (const outputsForAddress of outputsForAddresses) {
    if (outputsForAddress.kind === 'error') {
      return { status: 400, body: outputsForAddress.errMsg}
    }
    result.push(...outputsForAddress.value);
  }
  return { status: 200, body: result };
}

async function getBalanceForAddress(address: string): Promise<UtilEither<number>> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: `error querying utxos for address`};
  const r: getApiV0AddressesP1SuccessResponse = await resp.json();
  if (r.transactions && typeof r.transactions.confirmedBalance === 'number') {
    return {
      kind: 'ok',
      value: r.transactions.confirmedBalance,
    };
  }
  return {
    kind: 'ok',
    value: 0,
  };
}

const utxoSumForAddresses: HandlerFunction = async function (req, _res) {
  const input: UtxoSumForAddressesInput = req.body;
  const balances = await Promise.all(
    input.addresses.map(getBalanceForAddress)
  );

  let sum = new BigNumber(0);
  for (const balance of balances) {
    if (balance.kind === 'error') {
      return {status: 400, body: balance.errMsg};
    }
    sum = sum.plus(balance.value);
  }
  const output: UtxoSumForAddressesOutput = { sum: sum.toString() };
  return { status: 200, body: output };
}

async function isUsed(address: string): Promise<UtilEither<{| used: boolean, address: string |}>> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: `error querying address information`};

  const r: getApiV0AddressesP1SuccessResponse = await resp.json();
  return {
    kind: 'ok',
    value: {
      used: r.transactions && r.transactions.totalReceived !== 0,
      address,
    },
  };
}

const filterUsed: HandlerFunction = async function (req, _res) {
  const input: FilterUsedInput = req.body;
  
  const usedStatuses = await Promise.all(
    input.addresses.map(isUsed)
  );
  const result: FilterUsedOutput = [];
  for (const status of usedStatuses) {
    if (status.kind === 'error') {
      return {status: 400, body: status.errMsg};
    }
    if (status.value.used) {
      result.push(status.value.address);
    }
  }
  return { status: 200, body: result };
}

async function getTxBody(txHash: string): Promise<UtilEither<[string, getApiV0TransactionsP1SuccessResponse]>> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/transactions/${txHash}`
  );
  if (resp.status !== 200) {
    return { kind: 'error', errMsg: `error sending transaction`};
  }

  const txBody: getApiV0TransactionsP1SuccessResponse = await resp.json();
  return {
    kind: 'ok',
    value: [ txHash, txBody ],
  };
}

const txBodies: HandlerFunction = async function (req, _res) {
  const input: TxBodiesInput = req.body;

  const txBodyEntries = await Promise.all(
    input.txHashes.map(getTxBody)
  );
  const result: {| [key: string]: getApiV0TransactionsP1SuccessResponse |} = {};
  for (const entry of txBodyEntries) {
    if (entry.kind === 'error') {
      return {status: 400, body: entry.errMsg};
    }
    result[entry.value[0]] = entry.value[1];
  }

  return { status: 200, body: result };
}

const history: HandlerFunction = async function (req, _res) {
  const input: HistoryInput = req.body;

  if(!req.body) {
    const errMsg = "error, no body";
    console.log(errMsg);
    return { status: 400, body: errMsg}
  }
  const verifiedBody = utils.validateHistoryReq(addressesRequestLimit, apiResponseLimit, input);

  switch (verifiedBody.kind) {
    case "ok":
      const body = verifiedBody.value;
      const limit = apiResponseLimit;
      const [referenceTx, referenceBlock] = (body.after && [body.after.tx, body.after.block]) || [];
      const referenceBestBlock = body.untilBlock;

      const afterBlockNum = await askBlockNum(referenceBlock, referenceTx != undefined ? referenceTx : "");
      const untilBlockNum = await askBlockNum(referenceBestBlock);

      if (afterBlockNum.kind === 'error') {
        return { status: 400, body: afterBlockNum.errMsg}
      }
      if (untilBlockNum.kind === 'error') {
        return { status: 400, body: untilBlockNum.errMsg}
      }

      const unformattedTxs = await askTransactionHistory(limit, body.addresses, afterBlockNum.value, referenceTx, untilBlockNum.value);
      if (unformattedTxs.kind === 'error') {
        return { status: 400, body: unformattedTxs.errMsg}
      }
      const txs = unformattedTxs.value.map((tx) => {
        const creationHeight = getCreationHeight(tx);
        const iso8601date = new Date(tx.timestamp).toISOString()
        return {
          hash: tx.id,
          tx_state: 'Successful', // explorer doesn't handle pending transactions
          block_num: creationHeight,
          block_hash: tx.headerId,
          time: iso8601date,
          epoch: 0, // TODO
          slot: 0, // TODO
          inputs: tx.inputs,
          outputs: tx.outputs
        }
      });

      return { status: 200, body: txs };

    case "error":
      console.log(verifiedBody.errMsg);
      return { status: 400, body: verifiedBody.errMsg };

    default: return utils.assertNever(verifiedBody);
  }
}

const status: HandlerFunction = async function (req, _res) {
  const resp = await fetch(
      `${config.backend.explorer}/api/v0/info`
  );
  const output: StatusOutput = {
    isServerOk: resp.status === 200,
  };
  return { status: 200, body: output };
}

exports.handlers = [
  { method: 'post', url: '/api/txs/utxoForAddresses', handler: utxoForAddresses },
  { method: 'post', url: '/api/txs/txBodies', handler: txBodies },
  { method: 'post', url: '/api/txs/utxoSumForAddresses', handler: utxoSumForAddresses },
  { method: 'post', url: '/api/v2/addresses/filterUsed', handler: filterUsed },
  { method: 'post', url: '/api/v2/txs/history', handler: history },
  { method: 'get', url: '/api/v2/bestBlock', handler: bestBlock },
  { method: 'post', url: '/api/txs/signed', handler: signed },
  { method: 'get', url: '/api/status', handler: status },
];
