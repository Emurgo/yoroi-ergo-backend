// @flow
const fetch = require('node-fetch');

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
    input: { addresses: ['2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU'] },
    output: [{
      tx_hash: '0100ba9d4eae1b7aa79708d9ff592437ebe739a535bc818cdfb429431ea758b4',
      tx_index: 0,
      utxo_id: '0100ba9d4eae1b7aa79708d9ff592437ebe739a535bc818cdfb429431ea758b40',
      receiver: '2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU',
      amount: '74789527500000000'
      }]
  },

  {
    name: 'empty input for utxoSumForAddresses',
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: [] },
    output: { sum: '0' },
  },

  {
    method: 'post',
    endpoint: '/api/txs/utxoSumForAddresses',
    input: { addresses: ['2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU'] },
    output: { sum: '2221505730000000000' },
  },

  {
    method: 'post',
    endpoint: '/api/v2/addresses/filterUsed',
    input: { addresses: ['2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU', '9eed7e8rBNurhftFCBNEt1PbHQHpktzU6vJonKexHoh43kHrRvP'] },
    output: [
      '2Z4YBkDsDvQj8BX7xiySFewjitqp2ge9c99jfes2whbtKitZTxdBYqbrVZUvZvKv6aqn9by4kp3LE1c26LCyosFnVnm6b6U1JYvWpYmL2ZnixJbXLjWAWuBThV1D6dLpqZJYQHYDznJCk49g5TUiS4q8khpag2aNmHwREV7JSsypHdHLgJT7MGaw51aJfNubyzSKxZ4AJXFS27EfXwyCLzW1K6GVqwkJtCoPvrcLqmqwacAWJPkmh78nke9H4oT88XmSbRt2n9aWZjosiZCafZ4osUDxmZcc5QVEeTWn8drSraY3eFKe8Mu9MSCcVU'
    ]
  },
  
];

const getUrl = endpoint => `http://localhost:3000${endpoint}`;

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
