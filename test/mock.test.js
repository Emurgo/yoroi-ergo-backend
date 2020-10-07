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
    name: 'history',
    method: 'post',
    endpoint: '/api/v2/txs/history',
    input: {
      addresses: [
        '9hHv758WyXQz3jW6W6cHufHqvcSk5rFv515JumKxrfwnR6iFcFv',
        '9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP'
      ],
      after: {
        block: 'ac4740b30371f48703f69b280ce74823539c4f7d4bc9d9368194912d12dcb287',
        tx: '3cb50adbf9ece09b900c63d12bf7edf39acf3df992b1139d2fa0ad02d4dfe20b',
      },
      untilBlock: 'a4e7c126bb3f26384efff11157b24fc09020f56bc782ad5b821097eeb6165dc1',
    },
    output: [{
      // note: block hash "0" is excluded due to "after" statement
      "block_hash": "1",
      "block_num": 1,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "1",
      "time": "1970-01-01T00:00:00.001Z",
      "tx_state": "Successful"
    },
    // note: if block hash is the same, txs are order by tx_ordinal
    {
      "block_hash": "1",
      "block_num": 1,
      "tx_ordinal": 1,
      "epoch": 0,
      "slot": 0,
      "hash": "2",
      "time": "1970-01-01T00:00:00.002Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "1",
      "block_num": 1,
      "tx_ordinal": 2,
      "epoch": 0,
      "slot": 0,
      "hash": "3",
      "time": "1970-01-01T00:00:00.003Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "1",
      "block_num": 1,
      "tx_ordinal": 3,
      "epoch": 0,
      "slot": 0,
      "hash": "4",
      "time": "1970-01-01T00:00:00.004Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "5",
      "block_num": 5,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "5",
      "time": "1970-01-01T00:00:00.005Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "6",
      "block_num": 6,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "6",
      "time": "1970-01-01T00:00:00.006Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "7",
      "block_num": 7,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "7",
      "time": "1970-01-01T00:00:00.007Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "8",
      "block_num": 8,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "8",
      "time": "1970-01-01T00:00:00.008Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "9",
      "block_num": 9,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "9",
      "time": "1970-01-01T00:00:00.009Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "10",
      "block_num": 10,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "10",
      "time": "1970-01-01T00:00:00.010Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "11",
      "block_num": 11,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "11",
      "time": "1970-01-01T00:00:00.011Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "12",
      "block_num": 12,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "12",
      "time": "1970-01-01T00:00:00.012Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "13",
      "block_num": 13,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "13",
      "time": "1970-01-01T00:00:00.013Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "14",
      "block_num": 14,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "14",
      "time": "1970-01-01T00:00:00.014Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "15",
      "block_num": 15,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "15",
      "time": "1970-01-01T00:00:00.015Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "16",
      "block_num": 16,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "16",
      "time": "1970-01-01T00:00:00.016Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "17",
      "block_num": 17,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "17",
      "time": "1970-01-01T00:00:00.017Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "18",
      "block_num": 18,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "18",
      "time": "1970-01-01T00:00:00.018Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "19",
      "block_num": 19,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "19",
      "time": "1970-01-01T00:00:00.019Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "20",
      "block_num": 20,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "20",
      "time": "1970-01-01T00:00:00.020Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "21",
      "block_num": 21,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "21",
      "time": "1970-01-01T00:00:00.021Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "22",
      "block_num": 22,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "22",
      "time": "1970-01-01T00:00:00.022Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "23",
      "block_num": 23,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "23",
      "time": "1970-01-01T00:00:00.023Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "24",
      "block_num": 24,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "24",
      "time": "1970-01-01T00:00:00.024Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "25",
      "block_num": 25,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "25",
      "time": "1970-01-01T00:00:00.025Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "26",
      "block_num": 26,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "26",
      "time": "1970-01-01T00:00:00.026Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "27",
      "block_num": 27,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "27",
      "time": "1970-01-01T00:00:00.027Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "28",
      "block_num": 28,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "28",
      "time": "1970-01-01T00:00:00.028Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "29",
      "block_num": 29,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "29",
      "time": "1970-01-01T00:00:00.029Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "30",
      "block_num": 30,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "30",
      "time": "1970-01-01T00:00:00.030Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "31",
      "block_num": 31,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "31",
      "time": "1970-01-01T00:00:00.031Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "32",
      "block_num": 32,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "32",
      "time": "1970-01-01T00:00:00.032Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "33",
      "block_num": 33,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "33",
      "time": "1970-01-01T00:00:00.033Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "34",
      "block_num": 34,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "34",
      "time": "1970-01-01T00:00:00.034Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "35",
      "block_num": 35,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "35",
      "time": "1970-01-01T00:00:00.035Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "36",
      "block_num": 36,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "36",
      "time": "1970-01-01T00:00:00.036Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "37",
      "block_num": 37,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "37",
      "time": "1970-01-01T00:00:00.037Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "38",
      "block_num": 38,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "38",
      "time": "1970-01-01T00:00:00.038Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "39",
      "block_num": 39,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "39",
      "time": "1970-01-01T00:00:00.039Z",
      "tx_state": "Successful"
    }, {
      "block_hash": "40",
      "block_num": 40,
      "tx_ordinal": 0,
      "epoch": 0,
      "slot": 0,
      "hash": "40",
      "time": "1970-01-01T00:00:00.040Z",
      "tx_state": "Successful"
    },
    // note: cutoff successful txs because of "before"
    // note: pending txs are ordered by timestamp
    {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "0",
      "time": "1970-01-01T00:00:00.000Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "1",
      "time": "1970-01-01T00:00:00.001Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "2",
      "time": "1970-01-01T00:00:00.002Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "3",
      "time": "1970-01-01T00:00:00.003Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "4",
      "time": "1970-01-01T00:00:00.004Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "5",
      "time": "1970-01-01T00:00:00.005Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "6",
      "time": "1970-01-01T00:00:00.006Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "7",
      "time": "1970-01-01T00:00:00.007Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "8",
      "time": "1970-01-01T00:00:00.008Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }, {
      "block_hash": null,
      "block_num": null,
      "tx_ordinal": null,
      "epoch": null,
      "slot": null,
      "hash": "9",
      "time": "1970-01-01T00:00:00.009Z",
      "tx_state": "Pending",
      "inputs": [],
      "dataInputs": [],
      "outputs": []
    }],
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
