# Yoroi Ergo Backend

This is a wrapper for the [Ergo explorer API](https://explorer.ergoplatform.com/en/api) so that the endpoints work well with the Yoroi wallet.

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
