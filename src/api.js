// @flow
const config = require('config');
const fetch = require('node-fetch');
const utils = require('./utils');

import type {
  HandlerFunction,
  UtxoForAddressesInput,
  UtxoForAddressesOutput,
  UtxoSumForAddressesInput,
  UtxoSumForAddressesOutput,
  FilterUsedInput,
  FilterUsedOutput,
  TxBodiesInput,
  TxBodiesOutput,
  HistoryInput,
  HistoryOutput,
  StatusOutput,
} from './types';

const addressesRequestLimit = 50;
const apiResponseLimit = 50;

const askBlockNum = async (blockHash: string, txHash: string): Promise<utils.UtilEither<number>> => {
  if (blockHash == undefined) return {kind:'ok', value: -1};

  const resp = await fetch(
      `${config.backend.explorer}/api/v0/blocks/${blockHash}`
  );
  if (resp.status !== 200) return {kind:'error', errMsg: 'after block not found.'};

  const r = await resp.json();

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

const askTransactionHistory = async (
    limit: number
    , addresses: string[]
    , afterNum: utils.UtilEither<number>
    , afterTxHash: ?string
    , untilNum: utils.UtilEither<number>) : Promise<utils.UtilEither<TransactionFrag[]>> => {

  let output: any = [];

  const addressesPromises = addresses.map((address) => (
      fetch(`${config.backend.explorer}/api/v0/addresses/${address}/transactions`)
  ))

  const responses = await Promise.all(addressesPromises)
  const responsesJson = await Promise.all(responses.map((resp) => (resp.json())))

  if (responsesJson.length == 0) return output;

  for(const response of responsesJson[0].items) {
    // filter by limit after and until
    if (response.creationHeight <= afterNum) {
      continue;
    }
    if (response.creationHeight > untilNum) {
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

  return output;
}

const bestBlock: HandlerFunction = async function (req, _res) {
  const resp = await fetch(
      `${config.backend.explorer}/api/v0/blocks`
  );

  const r = await resp.json();
  const output = {
    epoch: 0,
    slot: r.items[0].height,
    hash: r.items[0].id,
    height: r.items[0].height,
  };

  return { status: 200, body: output };
};

const signed: HandlerFunction = async function (req, _res) {
  if (req.body && !req.body.signedTx) {
    const errMsg = "Missing signedTx parameter";
    console.log(errMsg);
    return { status: 400, body: errMsg};
  }

  const signedTx = req.body.signedTx;
  const resp = await fetch(
      `${config.backend.explorer}/api/v0/transactions/send`,
      {
        method: 'post',
        body: JSON.stringify(signedTx)
      })

  const r = await resp.json();
  return { status: 200, body: r };
};

async function getUtxoForAddress(address: string): Promise<Object> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}/transactions`
  );
  const r = await resp.json();

  // Get all outputs whose `address` matches input address and `spentTransactionId` is `null`.
  return r.items.map(({ outputs }) => (
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
}


const utxoForAddresses: HandlerFunction = async function (req, _res) {
  const input: UtxoForAddressesInput = req.body;
  
  const output: UtxoForAddressesOutput = (await Promise.all(
    input.addresses.map(getUtxoForAddress)
  )).flat();
  return { status: 200, body: output };
}

async function getBalanceForAddress(address: string): Promise<number> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}`
  );
  const r = await resp.json();
  if (r.transactions && typeof r.transactions.confirmedBalance === 'number') {
    return r.transactions.confirmedBalance;
  }
  return 0;
}

const utxoSumForAddresses: HandlerFunction = async function (req, _res) {
  const input: UtxoSumForAddressesInput = req.body;
  const sum = (await Promise.all(
    input.addresses.map(getBalanceForAddress)
  )).reduce(((a, b) => a + b), 0);
  const output: UtxoSumForAddressesOutput = { sum: String(sum) };
  return { status: 200, body: output };
}

async function isUsed(address: string): Promise<{| used: boolean, address: string |}> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}`
  );
  const r = await resp.json();
  return {
    used: r.transactions && r.transactions.totalReceived !== 0,
    address,
  };
}

const filterUsed: HandlerFunction = async function (req, _res) {
  const input: FilterUsedInput = req.body;
  
  const output: FilterUsedOutput = (await Promise.all(
    input.addresses.map(isUsed)
  )).filter(({ used }) => used).map(({ address }) => address);

  return { status: 200, body: output };
}

async function getTxBody(txHash: string): Promise<[string, string]> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/transactions/${txHash}`
  );

  const txBody = await resp.json();
  return [ txHash, JSON.stringify(txBody) ];
}

const txBodies: HandlerFunction = async function (req, _res) {
  const input: TxBodiesInput = req.body;

  const output: TxBodiesOutput = Object.fromEntries(await Promise.all(
    input.txHashes.map(getTxBody)
  ));

  return { status: 200, body: output };
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
      const limit = body.limit || apiResponseLimit;
      const [referenceTx, referenceBlock] = (body.after && [body.after.tx, body.after.block]) || [];
      const referenceBestBlock = body.untilBlock;

      const afterBlockNum = await askBlockNum(referenceBlock, referenceTx != undefined ? referenceTx : "");
      const untilBlockNum = await askBlockNum(referenceBestBlock);

      if (afterBlockNum.errMsg !== undefined || untilBlockNum.errMsg !== undefined) {
        const errMsg = afterBlockNum.errMsg || untilBlockNum.errMsg;
        return { status: 400, body: errMsg}
      }

      const unformattedTxs = await askTransactionHistory(limit, body.addresses, afterBlockNum.value, referenceTx, untilBlockNum.value);
      const txs = unformattedTxs.map((tx) => {
        const iso8601date = new Date(tx.timestamp).toISOString()
        return {
          hash: tx.id,
          is_reference: tx.id === referenceTx,
          tx_state: 'Successful', // graphql doesn't handle pending/failed txs
          last_update: iso8601date,
          block_num: tx.creationHeight,
          block_hash: tx.headerId, // don't have it
          time: iso8601date,
          epoch: 0,
          slot: tx.creationHeight,
          inputs: tx.inputs,
          outputs: tx.outputs
        }
      });

      return { status: 200, body: txs };

    case "error":
      console.log(verifiedBody.errMsg);
      return;

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
