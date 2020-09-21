// @flow

// Types from https://explorer.ergoplatform.com/en/api

type FailResponse = {|
  status: number,
  reason: string,
|};

// api/v0/blocks/${blockHash}
export type getApiV0BlocksP1SuccessResponse = {
  "block": {
    "header": {
      "id": string,
      "parentId": string,
      "version": number,
      "height": number,
      "difficulty": string,
      "adProofsRoot": string,
      "stateRoot": string,
      "transactionsRoot": string,
      "timestamp": number,
      "nBits": number,
      "size": number,
      "extensionHash": string,
      "powSolutions": {
        "pk": string,
        "w": string,
        "n": string,
        "d": string,
        ...,
      },
      "votes": {
        "_1": number,
        "_2": number,
        "_3": number,
        ...,
      },
      ...,
    },
    "blockTransactions": Array<{
      "id": string,
      "headerId": string,
      "timestamp": number,
      "confirmationsCount": number,
      "inputs": Array<{
        "id": string,
        "spendingProof": string,
        "value": number,
        "transactionId": string,
        "index": number,
        "outputIndex": number,
        "outputTransactionId": string,
        "address": string,
        ...,
      }>,
      "dataInputs": Array<{
        "id": string,
        "value": number,
        "index": number,
        "outputIndex": number,
        "transactionId": string,
        "outputTransactionId": string,
        "address": string,
        ...,
      }>,
      "outputs": Array<{
        "id": string,
        "txId": string,
        "index": number,
        "value": number,
        "creationHeight": number,
        "ergoTree": string,
        "address": string,
        "assets": Array<{
            "tokenId": string,
            "amount": number,
            ...,
        }>,
        "additionalRegisters": {...},
        "spentTransactionId": null | string,
        "mainChain": boolean,
        ...,
      }>,
    }>,
    "extension": {
      "headerId": string,
      "digest": string,
      "fields": {...},
      ...,
    },
    "adProofs": string,
    ...,
  },
  "references": {
    "previousId": string,
    "nextId": string,
    ...,
  },
  ...,
};

export type getApiV0BlocksP1Response = getApiV0BlocksP1SuccessResponse | FailResponse;

// api/v0/addresses/${address}/transactions
export type getApiV0AddressesP1TransactionsItem = {
  "id": string,
  "headerId": string,
  "inclusionHeight": number,
  "index": number,
  "timestamp": number,
  "confirmationsCount": number,
  "inputs": Array<{
    "id": string,
    "spendingProof": string,
    "value": number,
    "index": number,
    "outputIndex": number,
    "transactionId": string,
    "outputTransactionId": string,
    "address": string,
    ...,
  }>,
  "dataInputs": Array<{
    "id": string,
    "value": number,
    "transactionId": string,
    "index": number,
    "outputIndex": number,
    "outputTransactionId": string,
    "address": string,
    ...,
  }>,
  "outputs": Array<{
    "id": string,
    "txId": string,
    "index": number,
    "value": number,
    "creationHeight": number,
    "ergoTree": string,
    "address": string,
    "assets": Array<{
      "tokenId": string,
      "amount": number,
      ...,
    }>,
    "additionalRegisters": {...},
    "spentTransactionId": null | string,
    "mainChain": boolean,
    ...,
  }>
};
export type getApiV0AddressesP1TransactionsSuccessResponse = {
  "items": Array<getApiV0AddressesP1TransactionsItem>,
  "total": number,
  ...,
};

export type getApiV0AddressesP1TransactionsResponse = getApiV0AddressesP1TransactionsSuccessResponse | FailResponse;

// api/v0/blocks
export type getApiV0BlocksSuccessResponse = {
  "items": Array<{
    "id": string,
    "height": number,
    "timestamp": number,
    "transactionsCount": number,
    "miner": {
      "address": string,
      "name": string,
      ...,
    },
    "size": number,
    "difficulty": number,
    "minerReward": number,
    ...,
  }>,
  "total": number,
  ...,
};
export type getApiV0BlocksResponse = getApiV0BlocksSuccessResponse | FailResponse;

// api/v0/transactions/send
export type postApiV0TransactionsSendSuccessResponse = {
  "id": string,
  ...,
};
export type postApiV0TransactionsSendResponse = postApiV0TransactionsSendSuccessResponse | FailResponse;

// api/v0/addresses/${address}
export type getApiV0AddressesP1SuccessResponse = {
  "summary": {
    "id": string,
    ...,
  },
  "transactions": {
    "confirmed": number,
    "totalReceived": string,
    "confirmedBalance": number,
    "totalBalance": number,
    "confirmedTokensBalance": Array<{
      "tokenId": string,
      "amount": number,
      ...,
    }>,
    "totalTokensBalance": Array<{
      "tokenId": string,
      "amount": number,
      ...,
    }>,
    ...,
  },
  ...,
};
export type getApiV0AddressesP1Response = getApiV0AddressesP1SuccessResponse | FailResponse;

// api/v0/transactions/${txHash}
export type getApiV0TransactionsP1SuccessResponse = {
  "inputs": Array<{
    "id": string,
    "spendingProof": string,
    "value": number,
    "transactionId": string,
    "index": number,
    "outputIndex": number,
    "outputTransactionId": string,
    "address": string,
    ...,
  }>,
  "dataInputs": Array<{
    "id": string,
    "value": number,
    "transactionId": string,
    "index": number,
    "outputIndex": number,
    "outputTransactionId": string,
    "address": string,
    ...,
  }>,
  "outputs": Array<{
    "id": string,
    "txId": string,
    "index": number,
    "value": number,
    "creationHeight": number,
    "ergoTree": string,
    "address": string,
    "assets": Array<{
      "tokenId": string,
      "amount": number,
      ...,
    }>,
    "additionalRegisters": {...},
    "spentTransactionId": null | string,
    "mainChain": boolean,
    ...,
  }>,
  "ioSummary": {
    "totalCoinsTransferred": number,
    "totalFee": number,
    "feePerByte": number,
    ...,
  },
  "summary": {
    id: string,
    confirmationsCount: number,
    timestamp: number,
    size: number,
    index: number,
    block: {
      id: string,
      height: number,
      ...,
    },
    ...
  },
  ...,
};
export type getApiV0TransactionsP1Response = getApiV0TransactionsP1SuccessResponse | FailResponse;

// api/v0/info
export type getApiV0InfoSuccessResponse = {
  "version": string,
  "supply": number,
  "transactionAverage": number,
  "hashRate": number,
  ...,
};
export type getApiV0InfoResponse = getApiV0InfoSuccessResponse | FailResponse;

// taken from the node API's swagger definition
export type postApiV0TransactionsSendRequest = {|
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
|};
