// @flow
const fetch = require('node-fetch');
const config = require('../config/development');

jest.setTimeout(30 * 1000);

type Spec = {|
  name?: string,
  endpoint: string,
  method: 'post' | 'get',
  input?: Object,
  output: Object | (Object) => void,
|};

const specs: Array<Spec> = [
  {
    name: 'empty input for utxoForAddresses',
    method: 'post',
    endpoint: '/api/txs/utxoForAddresses',
    input: { addresses: [] },
    output: []
  },
  {
    method: 'post',
    endpoint: '/api/txs/utxoForAddresses',
    input: { addresses: ['9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk'] },
    output: [
      {
        tx_hash: 'c7cfd2d8d27d52db60121b770e54e91596ce1c240f4e000dadaa8380c16afa13',
        tx_index: 0,
        utxo_id: 'c7cfd2d8d27d52db60121b770e54e91596ce1c240f4e000dadaa8380c16afa130',
        receiver: '9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk',
        amount: '100000000'
      }
    ],
  },
  {
    name: 'empty input for utxoSumForAddresses',
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: [] },
    output: { sum: '0' },
  },
  {
    name: 'zero utxoSumForAddresses',
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: ['9fzq1eba7sbiVYwtAV3GNufZEveKQsBPReX8Tmb9jtXjRJkttB7', '9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC'] },
    output: { sum: '0' },
  },
  {
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: ['9fzq1eba7sbiVYwtAV3GNufZEveKQsBPReX8Tmb9jtXjRJkttB7', '9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk'] },
    output: { sum: '100000000' },
  },

  {
    method: 'post',
    endpoint: '/api/v2/addresses/filterUsed',
    input: { addresses: ['9fzq1eba7sbiVYwtAV3GNufZEveKQsBPReX8Tmb9jtXjRJkttB7', '9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk', '9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC'] },
    output: [
      '9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk',
      '9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC'
    ],
  },

  {
    name: 'empty txBodies',
    method: 'post',
    endpoint: '/api/txs/txBodies',
    input: { txHashes: [] },
    output: {},
  },
  {
    method: 'post',
    endpoint: '/api/txs/txBodies',
    input: { txHashes: ['xxx'] },
    output: { xxx: 'xxx' },
  },
   
];

const getUrl = endpoint => `http://localhost:${config.server.port}${endpoint}`;

for (const spec of specs) {
  const name = (spec.name ? `${spec.name}:` : '') + `${spec.method} ${spec.endpoint}`;

  test(name, async () => {
    let resp;
    if (spec.method === 'post') {
      resp = await fetch(
        getUrl(spec.endpoint),
        {
          method: 'post',
          body: JSON.stringify(spec.input),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      resp = await fetch(getUrl(spec.endpoint));
    }
    const respJson = await resp.json();
    expect(resp.status).toBe(200);
    if (typeof spec.output === 'function') {
      spec.output(respJson)
    } else {
      expect(respJson).toEqual(spec.output);
    }
  });
}
