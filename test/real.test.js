// @flow
const fetch = require('node-fetch');
const config = require('../config/development');
const stableStringify = require('json-stable-stringify');

import type { getApiV0TransactionsP1SuccessResponse } from '../src/types/explorer';

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
    output: { sum: '0', tokensBalance: [] },
  },
  {
    name: 'zero utxoSumForAddresses',
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: ['9fzq1eba7sbiVYwtAV3GNufZEveKQsBPReX8Tmb9jtXjRJkttB7', '9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC'] },
    output: { sum: '0', tokensBalance: [] },
  },
  {
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: ['9fzq1eba7sbiVYwtAV3GNufZEveKQsBPReX8Tmb9jtXjRJkttB7', '9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk'] },
    output: { sum: '100000000', tokensBalance: [] },
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
    input: { txHashes: ['c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818', 'c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba'] },
    output: (output: getApiV0TransactionsP1SuccessResponse) => {
      // Must skip 'confirmationsCount' when comparing.
      // since the # of confirmations since we wrote this test keeps increasing
      const normalizeTxString = (tx: getApiV0TransactionsP1SuccessResponse) => {
        // $FlowExpectedError[incompatible-type] delete on purpose to match test
        delete tx.summary.confirmationsCount;
        return tx;
      };
      const normalizeOutput = (output: getApiV0TransactionsP1SuccessResponse) => Object.fromEntries(
        Object.entries(output).map(([ key, val ]) => [ key, normalizeTxString((val: any)) ])
      );
      expect(stableStringify(normalizeOutput(output))).toEqual(stableStringify(EXPECTED_TX_BODIES));
    },
  },
  
  {
    name: 'txBoxes',
    method: 'post',
    endpoint: '/api/v2/txs/boxes',
    input: { txHashes: ['c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818', 'c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba'] },
    output: (output) => {
      expect(output).toEqual(EXPECTED_TX_BOXES);
    },
  },

  {
    method: 'get',
    endpoint: '/api/v2/bestblock',
    output: (output) => {
      expect(typeof output.epoch).toBe('number');
      expect(typeof output.height).toBe('number');
      expect(typeof output.slot).toBe('number');
      expect(typeof output.hash).toBe('string');
    },
  },

  {
    name: 'assetInfo success cases',
    method: 'post',
    endpoint: '/api/assets/info',
    input: { assetIds: [
      'fb848441f6cad04de3235b290697329cc96852660da4b7c7b8a6b68e99a0a3ff',
      '82ebfb6141fbf31bd4a131017af86e24b5c367b17b3a30b3828bd419cf302dc9',
      '3ff9fdfcda75531d1b5933d016a128bacf92e33817ba9441a4838ba3f247da31',
    ] },
    output: (output) => {
      expect(output['fb848441f6cad04de3235b290697329cc96852660da4b7c7b8a6b68e99a0a3ff']).toEqual({
        name: null,
        desc: null,
        numDecimals: null,
        boxId: 'a91a141904823b5aea0b33458a435d0ef3ab15975ca2b6afd07d43fd8bca9476',
        height: 345903,
      });
      expect(output['82ebfb6141fbf31bd4a131017af86e24b5c367b17b3a30b3828bd419cf302dc9']).toEqual({
        name: 'Coinbarn',
        desc: 'test token of coinbarn.app',
        numDecimals: 3,
        boxId: '02030bb1e88597b28e88e807d8308cddde7291527e194fc44b5137fe7452f255',
        height: 98787,
      });
      expect(output['3ff9fdfcda75531d1b5933d016a128bacf92e33817ba9441a4838ba3f247da31']).toEqual({
        name: '.;.',
        desc: `';`,
        numDecimals: null,
        boxId: '24052b29cb831d87ac8407e7f4af1851e4763e119ac97dd1de6332411279ecd7',
        height: 267222,
      });
    },
  },


  {
    name: 'history',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      addresses: ['9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP'],
      after: {
        block: 'ac4740b30371f48703f69b280ce74823539c4f7d4bc9d9368194912d12dcb287',
        tx: '3cb50adbf9ece09b900c63d12bf7edf39acf3df992b1139d2fa0ad02d4dfe20b',
      },
      untilBlock: 'a4e7c126bb3f26384efff11157b24fc09020f56bc782ad5b821097eeb6165dc1',
    },
    output: [{
      "block_hash": "a4e7c126bb3f26384efff11157b24fc09020f56bc782ad5b821097eeb6165dc1",
      "block_num": 277204,
      "tx_ordinal": 1,
      "epoch": 0,
      "hash": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "inputs": [{
        "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
        "id": "10e1a0c4b70c039e247e46009f31cc476af7bc11427c87d9faf44962ca9df58b",
        "index": 0,
        "outputIndex": 0,
        "outputTransactionId": "afba0bbc18411f581250baa195f0c0905a37bf2b0e15328b23184541c5907897",
        "spendingProof": "83ba8176e1160b53f4099cd084797011fbd8524df3a4e4ece19b6f919c4e2af011b84d908c2c255acf3285afc00d4065a7b56a4b1daa52fe",
        "transactionId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
        "value": 11580000000,
      }],
      "dataInputs": [],
      "outputs": [{
        "additionalRegisters": {},
        "address": "9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk",
        "assets": [],
        "creationHeight": 277185,
        "ergoTree": "0008cd02e20fc6a399d5331ef53ee1a7c3a5536638b31cef5427676d955756c668f7863d",
        "id": "c7cfd2d8d27d52db60121b770e54e91596ce1c240f4e000dadaa8380c16afa13",
        "index": 0,
        "mainChain": true,
        "spentTransactionId": null,
        "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
        "value": 100000000,
      }, {
        "additionalRegisters": {},
        "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
        "assets": [],
        "creationHeight": 277185,
        "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
        "id": "ec0211f993cef97787db0f3ea66461a4fa0d515ac7c860dce2e427498fa04040",
        "index": 1,
        "mainChain": true,
        "spentTransactionId": "0c0c06b9b3dc6c71518a1e30c3d2224b028eee4bbf0e2b5dfac13e868f12deb8",
        "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
        "value": 1000000,
      }, {
        "additionalRegisters": {},
        "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
        "assets": [],
        "creationHeight": 277185,
        "ergoTree": "0008cd02112bad551ee053cc6dce65ac6ebca86cdf73ff5e7b22ab54c07f3afb37e2cd00",
        "id": "ec3282762e5060dd41927b4d11995bfef4c9b24ab3338c01cc3e43bdbd4eff7c",
        "index": 2,
        "mainChain": true,
        "spentTransactionId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
        "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
        "value": 11479000000,
      }],
      "slot": 0,
      "time": "2020-07-20T14:07:28.692Z",
      "tx_state": "Successful",
    }],
  },

  {
    name: 'history',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      addresses: ['9hK1EHKmPPQu4YJrZDjQ2E5sYZxkHFGvU5kVTcxTxojgP28tWzC'],
      untilBlock: '008a03ddb289aea660f69165245b1448a3fb16dfc7b04061489a77f8911b6572',
    },
    output: (output) => {
      expect(output.length).toBe(16);

      // makes sure all utxos are being included by default
      for (let o of output) {
        expect(o.inputs).not.toBe(undefined); 
        expect(o.dataInputs).not.toBe(undefined); 
        expect(o.outputs).not.toBe(undefined); 
      }
    }
  },
  
  {
    name: 'history',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      addresses: ['9hK1EHKmPPQu4YJrZDjQ2E5sYZxkHFGvU5kVTcxTxojgP28tWzC'],
      untilBlock: '008a03ddb289aea660f69165245b1448a3fb16dfc7b04061489a77f8911b6572',
      concise: true,
    },
    output: (output) => {
      for (let o of output) {
        expect(o.inputs).toBe(null); 
        expect(o.dataInputs).toBe(null); 
        expect(o.outputs).toBe(null); 
      }
    }
  },

  {
    name: 'history',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      addresses: ['9en2JxyCnQgjgRCaFMXBX87z1VcGjVvd3yug2GVmJXRHw59Evgz'],
      untilBlock: '5aa15b0eb56ca3c4feab2fc99c53eef6f7fbf4beefa8a0e1bc76e7bd72118a0a',
    },
    output: (output) => {
      expect(output.length).toBe(20);
    }
  },

    {
    name: 'history: reference and first tx in the same block',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      after: {
        block: "c55c3d9c802ee02ac56982587ba42ea9da0ab545913eae94001b33986461b4ff",
        tx: "bb6dc22ac44ecafa27ef9fb6b0c8379077355ad72e1661aa34fc5ce43c95fbbb"
      },
      addresses: ['9f5SeYwRHj7T2ECzfozEZY5MRtSD3Dp6RHK1F2Sz1riCFnQky18'],
      untilBlock: '88f457258703c86b58ebf1255d95bc9ea471c7fb37352b5a7ce52b9ae59fda72',
    },
    output: (output) => {
      expect(output[0].hash).toBe("06b2cd455a1d9d08c3a9edb8607a1bfcb28da89c44b71515f4d2f880ca7115bd");
    }
  },

  {
    method: 'get',
    endpoint: '/api/status',
    output: { isServerOk: true },
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

const EXPECTED_TX_BODIES = {
  "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818": {
    "summary": {
      "id": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "timestamp": 1595254048692,
      "size": 298,
      "index": 1,
      "block": {
        "id": "a4e7c126bb3f26384efff11157b24fc09020f56bc782ad5b821097eeb6165dc1",
        "height": 277204
      }
    },
    "ioSummary": {
      "totalCoinsTransferred": 11580000000,
      "totalFee": 1000000,
      "feePerByte": 3355.7046979865772
    },
    "inputs": [{
      "id": "10e1a0c4b70c039e247e46009f31cc476af7bc11427c87d9faf44962ca9df58b",
      "index": 0,
      "spendingProof": "83ba8176e1160b53f4099cd084797011fbd8524df3a4e4ece19b6f919c4e2af011b84d908c2c255acf3285afc00d4065a7b56a4b1daa52fe",
      "value": 11580000000,
      "transactionId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "outputTransactionId": "afba0bbc18411f581250baa195f0c0905a37bf2b0e15328b23184541c5907897",
      "outputIndex": 0,
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP"
    }],
    "dataInputs": [],
    "outputs": [{
      "id": "c7cfd2d8d27d52db60121b770e54e91596ce1c240f4e000dadaa8380c16afa13",
      "value": 100000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02e20fc6a399d5331ef53ee1a7c3a5536638b31cef5427676d955756c668f7863d",
      "address": "9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": null,
      "mainChain": true,
      "index": 0,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }, {
      "id": "ec0211f993cef97787db0f3ea66461a4fa0d515ac7c860dce2e427498fa04040",
      "value": 1000000,
      "creationHeight": 277185,
      "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
      "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "0c0c06b9b3dc6c71518a1e30c3d2224b028eee4bbf0e2b5dfac13e868f12deb8",
      "mainChain": true,
      "index": 1,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }, {
      "id": "ec3282762e5060dd41927b4d11995bfef4c9b24ab3338c01cc3e43bdbd4eff7c",
      "value": 11479000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02112bad551ee053cc6dce65ac6ebca86cdf73ff5e7b22ab54c07f3afb37e2cd00",
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "mainChain": true,
      "index": 2,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }]
  },
  "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba": {
    "summary": {
      "id": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "timestamp": 1595325403313,
      "size": 298,
      "index": 1,
      "block": {
        "id": "1e7cdc9a94a0550ceaf67ef07065e8eb94f1833270423de4934e5895557976f6",
        "height": 277739
      }
    },
    "ioSummary": {
      "totalCoinsTransferred": 11479000000,
      "totalFee": 1000000,
      "feePerByte": 3355.7046979865772
    },
    "inputs": [{
      "id": "ec3282762e5060dd41927b4d11995bfef4c9b24ab3338c01cc3e43bdbd4eff7c",
      "index": 0,
      "spendingProof": "a1c8fd9ebeb137f35f2895b19261cc49d5809914a55ea2217f76c9fa6757bee3be64bd28534716c42d7a85c57f17040604b4064d18eae247",
      "value": 11479000000,
      "transactionId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "outputTransactionId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "outputIndex": 2,
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP"
    }],
    "dataInputs": [],
    "outputs": [{
      "id": "ad5c30cc1e9212d30dff67eb24352e92574811014b638bd8fb4842c1d1ab77f7",
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "value": 100000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd021f8ae613e89524abd660e516c7b0586e2954ebd16412f05a2f616d4734197682",
      "address": "9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "4d764bf87c1482d5fbe90d73c9be5e3c50f8e8b10ca7879522eb5c013191f730",
      "mainChain": true,
      "index": 0,
    }, {
      "id": "7fff0ab27f2500c7b4248ab3690d9d0629559b11aaa470a3d38c78fd144f4b22",
      "value": 1000000,
      "creationHeight": 277185,
      "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
      "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "9b047101bd26c682f2d98fe301af8a3b691b735e36512ac03af6a6f1dc98d767",
      "mainChain": true,
      "index": 1,
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
    }, {
      "id": "357e426d52f51c40f2b4cb6a07e384622447e921b7749e24b2ce8d0305ae4b32",
      "value": 11378000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02112bad551ee053cc6dce65ac6ebca86cdf73ff5e7b22ab54c07f3afb37e2cd00",
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": null,
      "mainChain": true,
      "index": 2,
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
    }]
  }
};

const EXPECTED_TX_BOXES = {
  "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818": {
    "inputs": [{
      "id": "10e1a0c4b70c039e247e46009f31cc476af7bc11427c87d9faf44962ca9df58b",
      "index": 0,
      "spendingProof": "83ba8176e1160b53f4099cd084797011fbd8524df3a4e4ece19b6f919c4e2af011b84d908c2c255acf3285afc00d4065a7b56a4b1daa52fe",
      "value": 11580000000,
      "transactionId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "outputTransactionId": "afba0bbc18411f581250baa195f0c0905a37bf2b0e15328b23184541c5907897",
      "outputIndex": 0,
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP"
    }],
    "dataInputs": [],
    "outputs": [{
      "id": "c7cfd2d8d27d52db60121b770e54e91596ce1c240f4e000dadaa8380c16afa13",
      "value": 100000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02e20fc6a399d5331ef53ee1a7c3a5536638b31cef5427676d955756c668f7863d",
      "address": "9gEcxPe4ztVEhk97tU9iU632juQxMwfht4kZ37xbWF2tdLqpcDk",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": null,
      "mainChain": true,
      "index": 0,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }, {
      "id": "ec0211f993cef97787db0f3ea66461a4fa0d515ac7c860dce2e427498fa04040",
      "value": 1000000,
      "creationHeight": 277185,
      "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
      "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "0c0c06b9b3dc6c71518a1e30c3d2224b028eee4bbf0e2b5dfac13e868f12deb8",
      "mainChain": true,
      "index": 1,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }, {
      "id": "ec3282762e5060dd41927b4d11995bfef4c9b24ab3338c01cc3e43bdbd4eff7c",
      "value": 11479000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02112bad551ee053cc6dce65ac6ebca86cdf73ff5e7b22ab54c07f3afb37e2cd00",
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "mainChain": true,
      "index": 2,
      "txId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
    }]
  },
  "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba": {
    "inputs": [{
      "id": "ec3282762e5060dd41927b4d11995bfef4c9b24ab3338c01cc3e43bdbd4eff7c",
      "index": 0,
      "spendingProof": "a1c8fd9ebeb137f35f2895b19261cc49d5809914a55ea2217f76c9fa6757bee3be64bd28534716c42d7a85c57f17040604b4064d18eae247",
      "value": 11479000000,
      "transactionId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "outputTransactionId": "c8df2f2d0dca51ab9a375ad9c77322cc11ebd7f3ba088168797e06371a573818",
      "outputIndex": 2,
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP"
    }],
    "dataInputs": [],
    "outputs": [{
      "id": "ad5c30cc1e9212d30dff67eb24352e92574811014b638bd8fb4842c1d1ab77f7",
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
      "value": 100000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd021f8ae613e89524abd660e516c7b0586e2954ebd16412f05a2f616d4734197682",
      "address": "9ekxEAKApantTt1S6QTzAi9nypppCE2ovzT6ktVuCUvArdStYWC",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "4d764bf87c1482d5fbe90d73c9be5e3c50f8e8b10ca7879522eb5c013191f730",
      "mainChain": true,
      "index": 0,
    }, {
      "id": "7fff0ab27f2500c7b4248ab3690d9d0629559b11aaa470a3d38c78fd144f4b22",
      "value": 1000000,
      "creationHeight": 277185,
      "ergoTree": "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304",
      "address": "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": "9b047101bd26c682f2d98fe301af8a3b691b735e36512ac03af6a6f1dc98d767",
      "mainChain": true,
      "index": 1,
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
    }, {
      "id": "357e426d52f51c40f2b4cb6a07e384622447e921b7749e24b2ce8d0305ae4b32",
      "value": 11378000000,
      "creationHeight": 277185,
      "ergoTree": "0008cd02112bad551ee053cc6dce65ac6ebca86cdf73ff5e7b22ab54c07f3afb37e2cd00",
      "address": "9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP",
      "assets": [],
      "additionalRegisters": {},
      "spentTransactionId": null,
      "mainChain": true,
      "index": 2,
      "txId": "c3f4930a770fca607177967684931b45b46e8bc35b3d1466c48feb927561a8ba",
    }]
  }
};
