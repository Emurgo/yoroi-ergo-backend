// @flow

import type {
  HandlerFunction,
  UtilEither,
} from '../src/types/utils';
import type {
  getApiV0BlocksP1SuccessResponse,
} from '../src/types/explorer';

const pendingForAddress: HandlerFunction = async function (req, _res) {
  const genPendingTx = (id, timestamp) => ({
    "id": id,
    "inputs": [],
    "dataInputs": [],
    "outputs": [],
    "creationTimestamp": timestamp,
    "size": 0,
  });
  const result = [];
  // will only take as many pending txs as needed to fill the max return size
  for (let i = 19; i >= 0; i--) {
    result.push(genPendingTx(i.toString(), i));
  }
  return {
    status: 200,
    body: {
      items: result,
      total: result.length,
    }
  };
}
const txsForAddress: HandlerFunction = async function (req, _res) {
  const genTx = (id, block_hash, block_num, tx_index, timestamp) => ({
    "id": id,
    "headerId": block_hash,
    "inclusionHeight": block_num,
    "index": tx_index,
    "timestamp": timestamp,
    "confirmationsCount": 1,
    "additionalRegisters": {},
    "spentTransactionId": null,
    "mainChain": true,
  });
  const result = [];

  // make sure duplicate txs are ignored
  if (req.params.address === '9hHv758WyXQz3jW6W6cHufHqvcSk5rFv515JumKxrfwnR6iFcFv') {
    let i = 30;
    result.push(genTx(
      i.toString(),
      i.toString(),
      i,
      0,
      i,
    ));
    return {
      status: 200,
      body: {
        items: result,
        total: result.length,
      }
    };
  }

  // tx should be excluded by the "after" statement
  result.push(genTx(
    "0",
    "0",
    0,
    0,
    0,
  ));

  // tx index should be used if block hash matches
  for (let i = 4; i >= 1; i--) {
    result.push(genTx(
      i.toString(),
      "1",
      1,
      i-1,
      i,
    ));
  }
  // properly cutoff transactions when untilBlock is hit
  for (let i = 49; i >= 5; i--) {
    result.push(genTx(
      i.toString(),
      i.toString(),
      i,
      0,
      i,
    ));
  }
  return {
    status: 200,
    body: {
      items: result,
      total: result.length,
    }
  };
}
const bestBlock: HandlerFunction = async function (req, _res) {
  return {
    status: 200,
    body: {
      items: [{
        "id": "a0dcec4a7d16dd3eea9bb93b9107adb4b239a2543a717e148b53e67b7a7cda36",
        "height": 333880,
        "timestamp": 1602037199968,
        "transactionsCount": 3,
        "miner": {
          "address": "88dhgzEuTXaRrX4qFhqAWYSVkkcmkqz6cRcziL5U5UugUNs21S2YkbfSMk4xusMgrwttGbBH9XASJ2DL",
          "name": "9XASJ2DL"
        },
        "size": 10541,
        "difficulty": 1838022664388608,
        "minerReward": 67500000000
      }],
      total: 1,
    }
  };
}

const getBlock: HandlerFunction = async function (req, _res) {
  const genResponse = (height, transactions) => ({
    "block": {
      "header": {
        "height": height,
        ...(null: any),
      },
      "blockTransactions": transactions,
      "extension": (null: any),
      "adProofs": (null: any)
    },
    "references": (null: any)
  });
  if (req.params.blockHash === 'a4e7c126bb3f26384efff11157b24fc09020f56bc782ad5b821097eeb6165dc1') {
    return {
      status: 200,
      body: genResponse(
        40,
        []
      )
    };
  }
  if (req.params.blockHash === 'ac4740b30371f48703f69b280ce74823539c4f7d4bc9d9368194912d12dcb287') {
    return {
      status: 200,
      body: genResponse(
        0,
        [{
          "id": "3cb50adbf9ece09b900c63d12bf7edf39acf3df992b1139d2fa0ad02d4dfe20b",
          "headerId": "ac4740b30371f48703f69b280ce74823539c4f7d4bc9d9368194912d12dcb287",
          "inclusionHeight": 0,
          "timestamp": 1602037199968,
          "index": 0,
          "confirmationsCount": 1,
          "inputs": [],
          "dataInputs": [],
          "outputs": []
        }]
      )
    };
  }
  throw new Error(`Unknown block ${req.params.blockHash}`);
}

exports.handlers = [
  { method: 'get', url: '/api/v0/transactions/unconfirmed/byAddress/:address', handler: pendingForAddress },
  { method: 'get', url: '/api/v0/addresses/:address/transactions', handler: txsForAddress },
  { method: 'get', url: '/api/v0/blocks', handler: bestBlock },
  { method: 'get', url: '/api/v0/blocks/:blockHash', handler: getBlock },
];
