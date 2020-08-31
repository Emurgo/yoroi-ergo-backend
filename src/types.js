// @flow
import type { Request, Response } from 'restify';

export type HandlerReturn = {|
  status: number,
  body: Object,
|};

export type HandlerFunction =
  (request: Request, response: Response) => Promise<HandlerReturn>;

export type HandlerDefinitions = Array<{|
  method: 'get' | 'post' ,
  url: string,
  handler: HandlerFunction,
|}>;

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
  sum: ?string,
|};

export type FilterUsedInput = {|
  addresses: Array<string>,
|};
export type FilterUsedOutput = Array<string>;

export type TxBodiesInput = {|
  txHashes: Array<string>
|};
export type TxBodiesOutput = {|
  [key: string]: string
|};

export type HistoryInput = {|
  addresses: Array<string>,
  // omitting "after" means you query starting from the genesis block
  after?: {
    block: string, // block hash
    tx: string, // tx hash
  },
  untilBlock: string, // block hash - inclusive
|};
export type HistoryOutput = Array<{|
  // information that is only present if block is included in the blockchain
  block_num: null | number,
  block_hash: null | string,
  tx_ordinal: null | number,
  time: null | string, // timestamp with timezone
  epoch: null | number,
  slot: null | number,

  // information that is always present
  hash: string,
  last_update: string, // timestamp with timezone
  tx_state: 'Successful' | 'Failed' | 'Pending',
  inputs: Array<{| // these will be ordered by the input transaction id asc
    address: string,
    amount: string,
    id: string, // concatenation of txHash || index
    index: number,
    txHash: string,
  |}>,
  outputs: Array<{| //these will be ordered by transaction index asc.
    address: string,
    amount: string,
  |}>,
|}>;

export type StatusOutput = {|
  isServerOk: boolean
|}

export interface UtilOK<T> {
    kind: "ok";
    value: T;
}
export interface UtilErr {
    kind: "error";
    errMsg: string;
}
export type UtilEither<T> = UtilOK<T> | UtilErr;
