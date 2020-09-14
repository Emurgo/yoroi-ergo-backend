// @flow

import type { UtilEither } from './types/utils';

/**
 * This method validates addresses request body
 * @param {Array[String]} addresses
 */
const validateAddressesReq = (addressRequestLimit: number, addresses: string[]): UtilEither<string[]> => {
    const errorMessage = `Addresses request length should be (0, ${addressRequestLimit}]`;
    if (!addresses) {
        return { kind: "error", errMsg: errorMessage };
    } else if (addresses.length === 0 || addresses.length > addressRequestLimit) {
        return { kind: "error", errMsg: errorMessage };
    }
    return { kind: "ok", value: addresses };
};

// type TxBlockData = {
//     // TODO
//     ...,
// };
type HistoryRequest = {
    addresses: string[],
    limit?: number,
    after?: TxBlockData,
    untilBlock: string,
    ...,
}

const validateHistoryReq = (addressRequestLimit:number, apiResponseLimit:number, data: any): UtilEither<HistoryRequest> => {
    if(!('addresses' in data))
        return {kind:"error", errMsg: "body.addresses does not exist."};
    if(!('untilBlock' in data))
        return {kind:"error", errMsg: "body.untilBlock does not exist."};
    if(('after' in data) && !('tx' in data.after))
        return {kind:"error", errMsg: "body.after exists but body.after.tx does not"};
    if(('after' in data) && !('block' in data.after))
        return {kind:"error", errMsg: "body.after exists but body.after.block does not"};
    if(('limit' in data) && typeof data.limit !== "number")
        return {kind:"error", errMsg: " body.limit must be a number"};
    if(('limit' in data) && data.limit > apiResponseLimit)
        return {kind:"error", errMsg: `body.limit parameter exceeds api limit: ${apiResponseLimit}`};

    const validatedAddresses = validateAddressesReq(addressRequestLimit, data.addresses);
    switch(validatedAddresses.kind){
        case "ok":
            return {kind:"ok", value: data};
        case "error":
            return {kind: "error", errMsg: "body.addresses: " +validatedAddresses.errMsg};
        default: return assertNever(validatedAddresses);
    }
};

module.exports = {
    validateHistoryReq,
    validateAddressesReq
}
