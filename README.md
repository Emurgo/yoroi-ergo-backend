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

  A pagination mechanism is provided to handled rollbacks.

  To handle pagination, we use an `after` and `untilBlock` field that refers to positions inside the chain. Usually, pagination works as follows:
  1) Query the `bestblock` endpoint to get the current tip of the chain (and call this `untilBlock`)
  2) Look up the last transaction your application has saved locally (and call this `after`)
  3) Query everything between `untilBlock` and `after`. If `untilBlock` no long exists, requery. If `after` no long exists, mark the transaction as failed and re-query with an earlier transaction
  4) If more results were returned than the maximum responses you can receive for one query, find the most recent transction included in the response and set this as the new `after` and then query again (with the same value for `untilBlock`)

  **Note**: this endpoint will throw an error if either the `untilBlock` or `after` fields no longer exist inside the blockchain (allowing your app to handle rollbacks). Notably, the error codes are
  - 'REFERENCE_BLOCK_MISMATCH'
  - 'REFERENCE_TX_NOT_FOUND'
  - 'REFERENCE_BEST_BLOCK_MISMATCH'

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
    omitBoxes?: boolean // setting this to true means the response will not include inputs, dataInputs nor outputs
  }
  ```
  Output:
  ```
  Array<{
    block_hash: null | string,
    block_num: null | number,
    tx_ordinal: null | number,
    epoch: null | 0, // TODO
    slot: null | 0, // TODO

    hash: string,
    time: string,
    tx_state: 'Successful' | 'Pending', // explorer doesn't handle failed transactions
    inputs: Array<{
      // these will be ordered by the input transaction id asc
      address: string,
      id: string,
      outputTransactionId: string,
      index: number,
      outputIndex: number, // index in tx that created the output we're consuming
      spendingProof: string | {
        proofBytes: null | string,
        extension: {...},
        ...,
      },
      transactionId: string,
      value: number,
      ...,
    }>,
    dataInputs: Array<{
      // these will be ordered by the input transaction id asc
      id: string,
      value: number,
      transactionId: string,
      outputIndex: number,
      outputTransactionId: string,
      address: string,
      ...,
    }>,
    outputs: Array<{
      // these will be ordered by the output transaction id asc
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
      txId: string,
      index: number,
      mainChain?: boolean,
      spentTransactionId?: null | string,
      value: number,
      ...
    }>,
  }>
  ```
</details>

<details>
  <summary>api/v2/txs/boxes</summary>

  Input:
  ```
  {
    txHashes: Array<string>,
  }
  ```
  Output:
  ```
  {
    [txHash: string]: {
      inputs: Array<{
        // these will be ordered by the input transaction id asc
        address: string,
        id: string,
        outputTransactionId: string,
        index: number,
        outputIndex: number, // index in tx that created the output we're consuming
        spendingProof: string | {
          proofBytes: null | string,
          extension: {...},
          ...,
        },
        transactionId: string,
        value: number,
        ...,
      }>,
      dataInputs: Array<{
        // these will be ordered by the input transaction id asc
        id: string,
        value: number,
        transactionId: string,
        outputIndex: number,
        outputTransactionId: string,
        address: string,
        ...,
      }>,
      outputs: Array<{
        // these will be ordered by the output transaction id asc
        additionalRegisters: { ... },
        address: string,
        assets: Array<{
          +amount: number,
          +tokenId: string,
          ...
        }>,
        creationHeight: number,
        ergoTree: string,
        id: string,
        txId: string,
        index: number,
        mainChain?: boolean,
        spentTransactionId?: null | string,
        value: number,
        ...
      }>,
    } 
  }
  ```
</details>

<details>
  <summary>api/v2/bestblock</summary>

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
  <summary>api/assets/info</summary>

  Input:
  ```
  {
    assetIds: string[]
  }
  ```
  Output:
  ```
  {
    [assetId: string]: {
      name: null | string,
      desc: null | string,
      numDecimals: null | number,
      // information about box that defined the metadata for this token
      height: null | number,
      boxId: string,
    }
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

`npm run remote:dev`

## Test

Tests still depend on querying a remote explore endpoint. The easiest way to do it is to

1) Start the endpoint connection with `npm run remote:dev`
2) Run the tests with `npm run remote:test`

### Test a single endpoint (using `utxoSumForAddresses` as an example)

`npm run remote:test -- -t utxoSumForAddresses`

## Production

`npm run start`
