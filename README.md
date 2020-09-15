# Yoroi Ergo Backend

This is a wrapper for the [Ergo explorer API](https://explorer.ergoplatform.com/en/api) so that the endpoints work well with the Yoroi wallet.

## API

<details>
  <summary>api/txs/utxoForAddresses</summary>

  Input:
  ```
  {
    addresses: Array<string>,
  }
  ```
  Output:
  ```
  Array<{
    amount: string,
    receiver: string,
    tx_hash: string,
    tx_index: number,
    utxo_id: string, // concat(tx_hash, tx_index)
  }>
  ```
</details>

<details>
  <summary>api/txs/txBodies</summary>

  Input:
  ```
  {
    txHashes: Array<string>,
  }
  ```
  Output:
  ```
  {
    [txHash: string]: Ergo explorer query api/v0/transactions/${txHash}
  }
  ```
</details>

<details>
  <summary>api/txs/utxoSumForAddresses</summary>

  Input:
  ```
  {
    addresses: Array<string>,
  }
  ```
  Output:
  ```
  {
    sum: string,
  }
  ```
</details>

<details>
  <summary>api/v2/addresses/filterUsed</summary>

  Input:
  ```
  {
    addresses: Array<string>,
  }
  ```
  Output:
  ```
  Array<string>
  ```
</details>

<details>
  <summary>api/v2/txs/history</summary>

  Input:
  ```
  {
    addresses: Array<string>,
    // omitting "after" means you query starting from the genesis block
    after?: {|
      block: string, // block hash
      tx: string, // tx hash
    |},
    untilBlock: string, // block hash - inclusive
  }
  ```
  Output:
  ```
  {
    block_hash: string,
    block_num: number,
    hash: string,
    inputs: Array<{
      address: string,
      id: string,
      outputTransactionId: string,
      spendingProof: string,
      transactionId: string,
      value: number,
      ...
    }>,
    outputs: Array<{
      additionalRegisters: { ... },
      address: string,
      assets: Array<{
        amount: number,
        tokenId: string,
        ...
      }>,
      creationHeight: number,
      ergoTree: string,
      id: string,
      mainChain: boolean,
      spentTransactionId: string,
      value: number,
      ...
    }>,
    epoch: 0, // TODO
    slot: 0, // TODO
    time: string, // ISO string
    tx_state: 'Successful', // explorer doesn't handle pending transactions
  }
  ```
</details>

<details>
  <summary>api/v2/bestBlock</summary>

  Input:
  ```
  undefined
  ```
  Output:
  ```
  {
    epoch: 0, // TODO
    slot: 0, // TODO
    hash: string,
    height: number,
  }
  ```
</details>

<details>
  <summary>api/txs/signed</summary>

  Input:
  ```
  {
    id?: string, // hex
    inputs: Array<{|
      boxId: string, // hex
      spendingProof: {|
        proofBytes: string, // hex
        extension: {| [key: string]: string /* hex */ |},
      |}, 
      extension?: {| [key: string]: string /* hex */ |},
    |}>,
    dataInputs: Array<{|
      boxId: string, // hex
      extension?: {| [key: string]: string /* hex */ |},
    |}>,
    outputs: Array<{|
      boxId?: string, // hex
      value: number,
      ergoTree: string, // hex
      creationHeight: number,
      assets?: Array<{|
        tokenId: string, // hex
        amount: number,
      |}>,
      additionalRegisters: {| [key: string]: string /* hex */ |},
      transactionId?: string, // hex
      index?: number,
    |}>,
    size?: number,
  }
  ```
  Output:
  ```
  {
    id: string, // hex
  }
  ```
</details>

<details>
  <summary>api/status</summary>

  Input:
  ```
  undefined
  ```
  Output:
  ```
  {
    isServerOk: boolean,
  }
  ```
</details>

## Development

`npm run dev`

## Test

Tests still depend on querying a remote explore endpoint. The easiest way to do it is to

1) Start the endpoint connection with `npm run dev`
2) Run the tests with `npm run test`

### Test a single endpoint (using `utxoSumForAddresses` as an example)

`npm run test -- -t utxoSumForAddresses`

## Production

`npm run start`
