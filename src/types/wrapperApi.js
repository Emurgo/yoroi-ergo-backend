// @flow

// types exposed by our endpoints

export type UtxoForAddressesInput = {|
  addresses: Array<string>,
|};
export type UtxoForAddressesOutput = Array<{|
  utxo_id: string, // concat tx_hash and tx_index
  tx_hash: string,
  tx_index: number,
  receiver: string,
  amount: string
|}>;

export type UtxoSumForAddressesInput = {|
  addresses: Array<string>,
|};
export type UtxoSumForAddressesOutput = {|
  sum: string,
|};

export type FilterUsedInput = {|
  addresses: Array<string>,
|};
export type FilterUsedOutput = Array<string>;

export type TxBodiesInput = {|
  txHashes: Array<string>
|};

export type HistoryInput = {|
  addresses: Array<string>,
  // omitting "after" means you query starting from the genesis block
  after?: {|
    block: string, // block hash
    tx: string, // tx hash
  |},
  untilBlock: string, // block hash - inclusive
|};
export type HistoryOutput = Array<{
  block_hash: null | string,
  block_num: null | number,
  tx_ordinal: null | number,
  epoch: null | 0, // TODO
  slot: null | 0, // TODO

  hash: string,
  time: string,
  tx_state: 'Successful' | 'Pending', // explorer doesn't handle failed transactions
  inputs: $ReadOnlyArray<$ReadOnly<{
    // these will be ordered by the input transaction id asc
    address: string,
    id: string,
    outputTransactionId: string,
    index: number,
    outputIndex: number, // index in tx that created the output we're consuming
    spendingProof: string | $ReadOnly<{
      proofBytes: null | string,
      extension: $ReadOnly<{...}>,
      ...,
    }>,
    transactionId: string,
    value: number,
    ...,
  }>>,
  dataInputs: $ReadOnlyArray<$ReadOnly<{
    // these will be ordered by the input transaction id asc
    id: string,
    value: number,
    transactionId: string,
    outputIndex: number,
    outputTransactionId: string,
    address: string,
    ...,
  }>>,
  +outputs: $ReadOnlyArray<$ReadOnly<{
    // these will be ordered by the output transaction id asc
    additionalRegisters: $ReadOnly<{ ... }>,
    address: string,
    assets: $ReadOnlyArray<$ReadOnly<{
      +amount: number,
      +tokenId: string,
      ...
    }>>,
    creationHeight: number,
    ergoTree: string,
    id: string,
    txId: string,
    index: number,
    mainChain?: boolean,
    spentTransactionId?: null | string,
    value: number,
    ...
  }>>,
}>;

export type StatusOutput = {|
  isServerOk: boolean
|}
