// @flow
const config = require('config');
const fetch = require('node-fetch');
const utils = require('./utils');
const BigNumber = require('bignumber.js');
const JSONBigInt = require('json-bigint-native');

import type {
  UtxoForAddressesInput,
  UtxoForAddressesOutput,
  UtxoSumForAddressesInput,
  UtxoSumForAddressesOutput,
  FilterUsedInput,
  FilterUsedOutput,
  TxBodiesInput,
  HistoryInput, HistoryOutput,
  StatusOutput,
  AssetInfoInput, AssetInfoOut, AssetInfo,
} from './types/wrapperApi';
import type {
  HandlerFunction,
  UtilEither,
} from './types/utils';
import type {
  getApiV0BlocksP1SuccessResponse,
  getApiV0AddressesP1TransactionsSuccessResponse,
  getApiV0TransactionsUnconfirmedByaddressP1SuccessResponse,
  getApiV0AddressesP1TransactionsItem,
  getApiV0TransactionsUnconfirmedByaddressP1Item,
  getApiV0BlocksSuccessResponse,
  postApiV0TransactionsSendSuccessResponse,
  postApiV0TransactionsSendRequest,
  getApiV0TransactionsP1SuccessResponse,
  getApiV0AddressesP1SuccessResponse,
  getApiV0AssetsP1IssuingboxSuccessResponse,
} from './types/explorer';

const addressesRequestLimit = 50;
const apiResponseLimit = 50;

const isNumberOrBigint = (x: *): boolean =>
  typeof x === 'number' || typeof x === 'bigint';

const askBlockNum = async (blockHash: ?string, txHash?: string): Promise<UtilEither<number>> => {
  if (blockHash == undefined) return {kind:'ok', value: -1};

  const resp = await fetch(
    `${config.backend.explorer}/api/v0/blocks/${blockHash}`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: 'block not found.'};

  const r: getApiV0BlocksP1SuccessResponse = await resp.json();

  if (txHash === "" || txHash == undefined) {
    return {kind:'ok', value: r.block.header.height};
  }

  for(const tx of r.block.blockTransactions) {
      if (tx.id === txHash) {
        return {kind: 'ok', value: r.block.header.height};
      }
  }

  return {kind:'error', errMsg: 'tx not found.'};
}

const askInChainTransaction = async (
  limit: number
    , addresses: string[]
    , afterNum: number
    , afterTxHash: ?string
    , untilNum: number
): Promise<UtilEither<$ReadOnlyArray<getApiV0AddressesP1TransactionsItem>>> => {
  const pagination = async (addr, acc, limit, offset) => {
    const resp = await fetch(
      `${config.backend.explorer}/api/v0/addresses/${addr}/transactions?limit=${limit}&offset=${offset}`
    );
    if (resp.status !== 200) return { errMsg: `error querying transactions for address` };
    const r: getApiV0AddressesP1TransactionsSuccessResponse = await resp.json();

    const newAcc = [
      ...acc,
      ...r.items,
    ];
    if (r.items.length < limit) {
      return { items: newAcc };
    }
    return await pagination(addr, newAcc, limit, offset + limit);
  }

  const inChainResponses = await Promise.all(addresses.map((address) => (
    pagination(address, [], apiResponseLimit, 0)
  )));

  // note: important to remove duplicates
  const seenTransactions = new Set<string>();

  const unfilteredResponses: Array<getApiV0AddressesP1TransactionsItem> = [];
  for (const response of inChainResponses) {
    if (response.errMsg) return {
      kind:'error',
      ...response,
    };
    for (const item of response.items) {
      if (seenTransactions.has(item.id)) continue;

      seenTransactions.add(item.id);
      unfilteredResponses.push(item);
    }
  }

  if (unfilteredResponses.length == 0) return {
    kind: 'ok',
    value: [],
  };

  let output: Array<getApiV0AddressesP1TransactionsItem> = [];

  // 1) Cutoff by block
  for(const response of unfilteredResponses) {
    // filter by limit after and until
    const creationHeight = response.inclusionHeight;
    if (creationHeight <= afterNum) {
      continue;
    }
    if (creationHeight > untilNum) {
      continue;
    }
    output.push(response);
  }

  // 2) Cutoff by transaction
  if (afterTxHash != undefined) {
    const index = output
      .findIndex((tx) => (tx.id === afterTxHash))

    // recall: check inside askBlockNum should guarantee this exists
    if (index == null) return {kind:'error', errMsg: `tx not found.`};
    output = output.slice(index + 1)
  }

  // 3) sort the result
  output.sort((tx1, tx2) => {
    // 1st sort by block height
    const heightDiff = tx1.inclusionHeight - tx2.inclusionHeight;
    if (heightDiff != 0) return heightDiff;

    // 2nd sort by index in tx
    const indexDiff = tx1.index - tx2.index;
    if (indexDiff != 0) return indexDiff;

    // we should never see the same transaction twice since we de-duplicated
    throw new Error(`askInChainTransaction same transaction occurs twice ${tx1.id}`)
  });

  // 4) cutoff to max response length
  const value = output.splice(0, apiResponseLimit);

  return {
    kind: 'ok',
    value,
  };
}
const askPendingTransaction = async (
  addresses: string[]
): Promise<UtilEither<$ReadOnlyArray<getApiV0TransactionsUnconfirmedByaddressP1Item>>> => {
  const pendingResponses = await Promise.all(addresses.map((address) => (
    // TODO: use offset parameter to paginate pending transactions
    fetch(`${config.backend.explorer}/api/v0/transactions/unconfirmed/byAddress/${address}?limit=${apiResponseLimit}`)
  )));

  // note: important to remove duplicates
  const seenTransactions = new Set<string>();

  const unfilteredResponses: Array<getApiV0TransactionsUnconfirmedByaddressP1Item> = [];
  for (const response of pendingResponses) {
    if (response.status !== 200) return {kind:'error', errMsg: `error querying pending transactions for address`};
    const json: getApiV0TransactionsUnconfirmedByaddressP1SuccessResponse = await response.json();

    for (const item of json.items) {
      if (seenTransactions.has(item.id)) continue;

      seenTransactions.add(item.id);
      unfilteredResponses.push(item);
    }
  }

  // sort only by time since the tx is not in a block yet
  const value = unfilteredResponses.sort((tx1, tx2) => tx1.creationTimestamp - tx2.creationTimestamp);

  return {
    kind: 'ok',
    value,
  };
}

/**
 * try parsing an int (base 10) and return NaN if it fails
 * Can't use parseInt because parseInt('1a') returns '1' instead of failing
 */
function hexToIntOrNaN(x: string) {
  return /^[0-9a-fA-F]+$/.test(x) ? Number.parseInt(x, 16) : NaN
}

function numDecimalsToNum(x: string | null): number | null {
  if (x == null) return x;
  return /^[0-9]+$/.test(x) ? Number.parseInt(x, 10) : null
}

const askAssetInfo = async (
  assetId: string
): Promise<UtilEither<[string, AssetInfo]>> => {
  const response = await fetch(
    `${config.backend.explorer}/api/v0/assets/${assetId}/issuingBox`
  );

  // a 500 error is returned if no issuing box was found for this asset
  if (response.status !== 200) return {kind:'error', errMsg: response.reason};
  const json: getApiV0AssetsP1IssuingboxSuccessResponse = await response.json();

  // although this endpoint returns an array, it should always return exactly one box
  if (json.length < 1) return {kind:'error', errMsg: `No issuing box found for ${assetId}`};
  const box = json[0];

  // note: the following code is all according to EIP-4
  // https://github.com/ergoplatform/eips/blob/master/eip-0004.md
  const decode = (field: void | string): null | string => {
    if (field == null) return null;
    // recall: every encoding start with 0e then one byte for length
    if (field.length < 3 * 2) return null; // minimum 3 bytes: 1 for prefix, 1 for length, 1 for content

    const expectedSize = hexToIntOrNaN(field.substring(2, 4));
    if (isNaN(expectedSize)) return null;
    const content = field.substring('0eff'.length);
    if (content.length != 2 * expectedSize) return null;

    const bytes = Buffer.from(content, 'hex');
    var string = new TextDecoder('utf-8').decode(bytes);

    return string;
  }

  return {
    kind: 'ok',
    value: [
      assetId,
      {
        name: decode(box.additionalRegisters['R4']),
        desc: decode(box.additionalRegisters['R5']),
        numDecimals: numDecimalsToNum(decode(box.additionalRegisters['R6'])),
        boxId: box.id,
        height: box.creationHeight,
      },
    ],
  };
}

const askTransactionHistory = async (
    limit: number
    , addresses: string[]
    , afterNum: number
    , afterTxHash: ?string
    , untilNum: number
  ): Promise<UtilEither<{|
    inChain: $ReadOnlyArray<getApiV0AddressesP1TransactionsItem>,
    pending: $ReadOnlyArray<getApiV0TransactionsUnconfirmedByaddressP1Item>,
  |}
  >> => {
  const inChain = await askInChainTransaction(
    limit,
    addresses,
    afterNum,
    afterTxHash,
    untilNum
  );
  if (inChain.kind === 'error') {
    return inChain;
  }

  const inChainTxs = inChain.value;
  // if we're already at the response limit, don't both fetching pending txs
  if (inChainTxs.length === apiResponseLimit) {
    return {
      kind: 'ok',
      value: {
        inChain: inChainTxs,
        pending: [],
      },
    };
  }

  const pending = await askPendingTransaction(addresses);
  if (pending.kind === 'error') {
    return pending;
  }
  // only add pending transactions up to the point where we reach apiResponseLimit
  const pendingTxs = pending.value.slice(0, apiResponseLimit - inChainTxs.length);

  return {
    kind: 'ok',
    value: {
      inChain: inChainTxs,
      pending: pendingTxs,
    },
  };
}

const bestBlock: HandlerFunction = async function (_req, _res) {
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
      body: JSON.stringify(body),
    }
  )

  if (resp.status !== 200) {
    return { status: 400, body: `error sending transaction`};
  }
  const r: postApiV0TransactionsSendSuccessResponse = await resp.json();
  return { status: 200, body: r };
};

async function getUtxoForAddress(address: string): Promise<UtilEither<UtxoForAddressesOutput>> {
  const pagination = async (addr, acc, limit, offset) => {
    const resp = await fetch(
      `${config.backend.explorer}/api/v0/addresses/${addr}/transactions?limit=${limit}&offset=${offset}`
    );
    if (resp.status !== 200) return { errMsg: `error querying utxos for address` };
    const r: getApiV0AddressesP1TransactionsSuccessResponse = JSONBigInt.parse(await resp.text());

    const newAcc = [
      ...acc,
      ...r.items,
    ];
    if (r.items.length < limit) {
      return { items: newAcc };
    }
    return await pagination(addr, newAcc, limit, offset + limit);
  }
  
  const paginatedResponse = await pagination(address, [], apiResponseLimit, 0);
  if (paginatedResponse.errMsg) return {
    kind:'error',
    ...paginatedResponse,
  };

  // Get all outputs whose `address` matches input address and `spentTransactionId` is `null`.
  const result = paginatedResponse.items.map(({ outputs }) => (
    outputs
      .map((output, index) => ({ output, index }))
      .filter(({ output, }) =>
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
  const r: getApiV0AddressesP1SuccessResponse = JSONBigInt.parse(await resp.text());
  if (r.transactions && isNumberOrBigint(r.transactions.confirmedBalance)) {
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
    sum = sum.plus(String(balance.value));
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
    return { kind: 'error', errMsg: `error getting tx body`};
  }

  const txBody: getApiV0TransactionsP1SuccessResponse = JSONBigInt.parse(await resp.text());
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
    return { status: 400, body: errMsg}
  }
  const verifiedBody = utils.validateHistoryReq(addressesRequestLimit, apiResponseLimit, input);

  if (verifiedBody.kind === 'error') {
    return { status: 400, body: verifiedBody.errMsg };
  }
  if (verifiedBody.kind !== 'ok') {
    return utils.assertNever(verifiedBody);
  }

  const body = verifiedBody.value;
  const limit = apiResponseLimit;
  const [referenceTx, referenceBlock] = (body.after && [body.after.tx, body.after.block]) || [undefined, undefined];
  const referenceBestBlock = body.untilBlock;

  const afterBlockNum = await askBlockNum(referenceBlock, referenceTx != undefined ? referenceTx : "");
  const untilBlockNum = await askBlockNum(referenceBestBlock);

  if (afterBlockNum.kind === 'error') {
    if (afterBlockNum.errMsg.includes('tx')) {
      throw new Error("REFERENCE_TX_NOT_FOUND");
    }
    if (afterBlockNum.errMsg.includes('block')) {
      throw new Error("REFERENCE_BLOCK_MISMATCH");
    }
    return { status: 400, body: afterBlockNum.errMsg}
  }
  if (untilBlockNum.kind === 'error') {
    throw new Error("REFERENCE_BEST_BLOCK_MISMATCH");
  }

  const unformattedTxs = await askTransactionHistory(limit, body.addresses, afterBlockNum.value, referenceTx, untilBlockNum.value);
  if (unformattedTxs.kind === 'error') {
    return { status: 400, body: unformattedTxs.errMsg}
  }

  const txs: HistoryOutput = [];
  // 1) first add the in-chain txs
  for (const tx of unformattedTxs.value.inChain) {
    const iso8601date = new Date(tx.timestamp).toISOString()
    txs.push({
      block_hash: tx.headerId,
      block_num: tx.inclusionHeight,
      tx_ordinal: tx.index,
      epoch: 0, // TODO
      slot: 0, // TODO

      hash: tx.id,
      time: iso8601date,
      tx_state: 'Successful',
      inputs: tx.inputs,
      dataInputs: tx.dataInputs,
      outputs: tx.outputs,
    });
  }
  // 2) add the pending txs
  for (const tx of unformattedTxs.value.pending) {
    const iso8601date = new Date(tx.creationTimestamp).toISOString()
    txs.push({
      block_hash: null,
      block_num: null,
      tx_ordinal: null,
      epoch: null,
      slot: null,

      hash: tx.id,
      time: iso8601date,
      tx_state: 'Pending',
      inputs: tx.inputs,
      dataInputs: tx.dataInputs,
      outputs: tx.outputs.map(output => ({
        ...output,
      })),
    });
  }
  return { status: 200, body: txs };
}

const assetsInfo: HandlerFunction = async function (req, _res) {
  const input: AssetInfoInput = req.body;

  const assetResponses = await Promise.all(
    input.assetIds.map((asset) => askAssetInfo(asset))
  );
  const result: AssetInfoOut = {};
  for (const entry of assetResponses) {
    if (entry.kind === 'error') {
      return {status: 400, body: entry.errMsg};
    }
    result[entry.value[0]] = entry.value[1];
  }

  return { status: 200, body: result };
}

const status: HandlerFunction = async function (_req, _res) {
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
  { method: 'post', url: '/api/assets/info', handler: assetsInfo },
  { method: 'get', url: '/api/v2/bestblock', handler: bestBlock },
  { method: 'post', url: '/api/txs/signed', handler: signed },
  { method: 'get', url: '/api/status', handler: status },
];
