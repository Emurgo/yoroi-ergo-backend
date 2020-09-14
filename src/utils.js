// @flow

import type { UtilEither } from './types/utils';
import type { HistoryInput } from './types/wrapperApi';

function assertNever(x: any): any {
  throw new Error ("this should never happen" + x);
}

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

const validateHistoryReq = (addressRequestLimit:number, apiResponseLimit:number, data: HistoryInput): UtilEither<HistoryInput> => {
    if(!('addresses' in data))
        return {kind:"error", errMsg: "body.addresses does not exist."};
    if(!('untilBlock' in data))
        return {kind:"error", errMsg: "body.untilBlock does not exist."};
    if((data.after != null) && !('tx' in data.after))
        return {kind:"error", errMsg: "body.after exists but body.after.tx does not"};
    if((data.after != null) && !('block' in data.after))
        return {kind:"error", errMsg: "body.after exists but body.after.block does not"};

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
    assertNever,
    validateHistoryReq,
    validateAddressesReq
}
