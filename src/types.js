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
