// @flow
const config = require('config');
const fetch = require('node-fetch');

import type {
  HandlerFunction,
  UtxoForAddressesInput,
  UtxoForAddressesOutput,
  UtxoSumForAddressesInput,
  UtxoSumForAddressesOutput,
  FilterUsedInput,
  FilterUsedOutput,
} from './types';



async function getUtxoForAddress(address: string): Promise<Object> {
  const resp = await fetch(
    `${config.backend.explorer}/api/v0/addresses/${address}/transactions`
  );
  const r = await resp.json();

  // Get all outputs whose `address` matches input address and `spentTransactionId` is `null`.
  return r.items.map(({ outputs }) => (
    outputs.filter(output =>
      output.address === address && output.spentTransactionId === null
    ).map((output, index) => ({ output, index }))
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
  // ??? use BN ?
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
  // ???
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

exports.handlers = [
  { method: 'post', url: '/api/txs/utxoForAddresses', handler: utxoForAddresses },
  { method: 'post', url: '/api/txs/utxoSumForAddresses', handler: utxoSumForAddresses },
  { method: 'post', url: '/api/v2/addresses/filterUsed', handler: filterUsed},
];
