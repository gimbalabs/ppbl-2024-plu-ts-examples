# vesting-pluts

[`plu-ts`](https://github.com/HarmonicLabs/plu-ts) implementation of the "vesting" contract example;

## Contract

the contract succeeds if the following two conditions are met:

- the transaction is signed by the `PPubKeyHash` defined in the UTxO datum;
- the transaction lower bound is `Finite` and greather than the datum `deadline` field

the contract source code can be found at [`src/contract.ts`](./src/contract.ts);

## Using the contract

the repository includes a series of scripts to interact with the contract:

### compile

compiles the contract defined in [`src/contract.ts`](./src/contract.ts) and saves the result in a file caled `testnet/vesting.plutus.json` following the `cardano-cli` format.

run using
```bash
npm run vesting:compile
```

### setup (private testnet)

> Alternatively you can use the `genKeys` script

requires the `PRIVATE_TESTNET_PATH` environment variable.

the `private-testnet` folder assumes a structure like the one of the [`woofpool/cardano-private-testnet-setup`](https://github.com/woofpool/cardano-private-testnet-setup)

run using
```bash
npm run vesting:setup
```

### genKeys (testnet or mainnet)

generates two pairs of keys and two addresses in the `./testnet` folder

run using
```bash
npm run vesting:genKeys
```

### create

creates an utxo on the contract with the `testnet/payment2.vkey` credentials as beneficiary and a deadline setted to 10 seconds after the execution of the script

run using
```bash
npm run vesting:create
```

### claim

tries to spend the first utxo on the contract using `testnet/payment2.skey` as `requiredSigner`

the transaction might fail if the deadline is not met

run using
```bash
npm run vesting:claim
```

### returnFaucet (testnet)

creates a trasaction using all `testnet/address1.addr` and `testnet/address2.addr` as input going to the testnet faucet.

run using
```bash
npm run vesting:returnFaucet
```