# Plutus Project Based Learning 
## Testing PPBL Faucet in Plu-ts
### Setup
```
$ git clone https://github.com/gimbalabs/ppbl-2024-plu-ts-examples.git
$ cd ppbl-2024-plu-ts-examples
$ npm install
$ cp .env.example .env
```

### Runing the emulator test suite
```
$ npm run test
...
Transaction Name     | CPU             | MEM         | FEE       
-----------------------------------------------------------------
Mint                 | 7,214,675       | 20,343      | 189,108 
Mint                 | 7,214,675       | 20,343      | 189,460 
Lock                 |                 |             | 174,697 
Withdraw             | 125,698,302     | 373,454     | 294,233 
Withdraw             | 159,902,578     | 449,016     | 303,171 
E2E Faucet Test - END

 ✓ src/tests/faucet.test.ts (6 tests) 11938ms
   ✓ Faucet > Mint Access Token  976ms
   ✓ Faucet > Mint Faucet Token 266ms
   ✓ Faucet > Lock Faucet Token  3833ms
   ✓ Faucet > Withdraw Faucet Token 1  3340ms
   ✓ Faucet > Withdraw Faucet Token 2  3486ms
   ✓ Faucet > Check Wallet Balance 2ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  12:29:55
   Duration  13.90s (transform 135ms, setup 0ms, collect 1.62s, tests 11.94s, environment 0ms, prepare 79ms)
```

### Generating keys and an address
Note: Generate the private and public keys using these scripts for testing purposes only!
```
npm genKeys
```


### Running each test cases against a real network (eg. preprod)
You will need to fund your network wallet corresponding to the address in the ```keys``` folder. Update and provide a valid Blockfrost API key in the ```.env``` file.
```
BLOCKFROST_API_KEY=blockfrost-api-key
```

The first step is to mint an accesss and a faucet token, but wait until you confirm each transaction after running each test.
```
$ npm run test:network "Mint Access Token"
$ npm run test:network "Mint Faucet Token"
```

Update the ```tokenNameHex``` and ```mintingPolicy``` for the correct access token and faucet token in the ```.env``` file
```
# Token Configuration
ACCESS_TOKEN_NAME_HEX=
ACCESS_TOKEN_POLICY=
FAUCET_TOKEN_NAME_HEX=
FAUCET_TOKEN_POLICY=
```

Next, lock the faucet tokens to the validator script address
```
$ npm run test:network "Lock Faucet Token"
```

Using a preprod cardano explorer such as https://preprod.cardanoscan.io/, you should be able to verify that the faucet tokens are locked at the script address using the tx id provided in the testing output.

Now, you are ready to execute the smart contract.
```
$ npm run test:network "Withdraw Faucet Token 1"
```

Once the transaction is confirmed, you will see the 100 faucet tokens transferred from the faucet validator script into the wallet.


For more information on plu-ts, please refer to the user documentation https://pluts.harmoniclabs.tech/



