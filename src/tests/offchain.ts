import { readFile } from "fs/promises";
import { Buffer } from 'buffer';
import {compile, DataB, DataConstr, DataI, defaultMainnetGenesisInfos, defaultProtocolParameters, Hash28, pBSToData, pByteString, pIntToData, PTxOutRef, TxBuilder} from '@harmoniclabs/plu-ts';
import { Address, Credential, PrivateKey, Value, PublicKey, Script, ScriptType } from "@harmoniclabs/plu-ts";
import { Emulator } from '@harmoniclabs/pluts-emulator';
import { BlockfrostPluts } from '@harmoniclabs/blockfrost-pluts';

import { ReturnType } from "./types";
import { mintingContract } from '../contracts/minting';
import { faucetContract } from '../contracts/faucet';
import FaucetDatum from '../FaucetDatum';
import FaucetRedeemer from '../FaucetRedeemer';
import { isMainnet } from './client';

// Global constants
const minAda = 5_000_000n;


/** @internal */
type MintArgs = {
  tokenName: string;
  tokenQty: bigint;
  client: Emulator | BlockfrostPluts;
};

export async function mint({
  tokenName,
  tokenQty,
  client,
}: MintArgs): Promise<ReturnType> {
  try {

    const privateKeyFile = await readFile("./testnet/payment1.skey", { encoding: "utf-8" });
    const privateKey = PrivateKey.fromCbor( JSON.parse(privateKeyFile).cborHex );
    const addr = await readFile("./testnet/address1.addr", { encoding: "utf-8" });
    const address = Address.fromString(addr);

    let utxos;
    if (client instanceof Emulator) {
        utxos = client.getAddressUtxos(address);
    } else {
        utxos = await client.addressUtxos(address);
    }
    const utxo = utxos?.find(utxo => utxo.resolved.value.lovelaces >= minAda);
    if (!utxo) {
        throw new Error("No UTxO with at least " + minAda + " lovelaces found");
    }

    const utxoRef = PTxOutRef.PTxOutRef({
      id: pBSToData.$(pByteString(utxo.utxoRef.id.toBuffer())),
      index: pIntToData.$(utxo.utxoRef.index),
    })

    const compiledMintingContract = compile(mintingContract.$(utxoRef));
        
    const mintingScript = new Script(
      ScriptType.PlutusV3,
      compiledMintingContract
    );

    const mintingAddr = new Address(
      isMainnet ? "mainnet" : "testnet",
      Credential.script(mintingScript.hash)
    );

    let txBuilder = new TxBuilder (defaultProtocolParameters, defaultMainnetGenesisInfos)

    let tx = txBuilder.buildSync({
        inputs: [{ utxo }],
        changeAddress: address,
        collaterals: [utxo],
        collateralReturn: {
          address: utxo.resolved.address,
          value: Value.sub(utxo.resolved.value, Value.lovelaces(minAda))
        },
        mints: [{
          value: Value.singleAsset(
            mintingAddr.paymentCreds.hash,
            Buffer.from(tokenName),
            tokenQty
          ),
          script: {
            inline: mintingScript,
            policyId: mintingAddr.paymentCreds.hash,
            redeemer: new DataI( 0 )
          }
        }]
      });
    
    tx.signWith( new PrivateKey(privateKey) );

    const submittedTx = await client.submitTx( tx );

    return {
      status: 200,
      txName: "Mint",
      txId: submittedTx,
      tokenNameHex: Buffer.from(tokenName).toString("hex"),
      mintingPolicy: mintingAddr.paymentCreds.hash.toString(),
      cpu: tx.witnesses?.redeemers?.[0]?.execUnits?.cpu || 0n,
      mem: tx.witnesses?.redeemers?.[0]?.execUnits?.mem || 0n,
      fee: tx.body.fee || 0n,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Mint tx failed: " + err,
    } as ReturnType;
  }
}

/** @internal */
type LockArgs = {
  withdrawalAmount: bigint;
  faucetLockedAmount: bigint;
  faucetTokenNameHex: string;
  faucetTokenPolicy: string;
  accessTokenPolicy: string;
  client: Emulator | BlockfrostPluts;
};

export async function lock({
  withdrawalAmount,
  faucetLockedAmount,
  faucetTokenNameHex,
  faucetTokenPolicy,
  accessTokenPolicy,
  client,
}: LockArgs): Promise<ReturnType> {
  try {

    const privateKeyFile = await readFile("./testnet/payment1.skey", { encoding: "utf-8" });
    const privateKey = PrivateKey.fromCbor( JSON.parse(privateKeyFile).cborHex );
    const addr = await readFile("./testnet/address1.addr", { encoding: "utf-8" });
    const address = Address.fromString(addr);
    
    const faucetTokenPolicyHash = new Hash28(faucetTokenPolicy);
    const compiledFaucetContract = compile(faucetContract.$(pByteString(accessTokenPolicy)).$(pByteString(faucetTokenPolicy)));
      
    const faucetScript = new Script(
        ScriptType.PlutusV3,
        compiledFaucetContract
    );

    const faucetAddr = new Address(
        isMainnet ? "mainnet" : "testnet",
        Credential.script( faucetScript.hash )
    );

    let utxos;
    if (client instanceof Emulator) {
        utxos = client.getAddressUtxos(address);
    } else {
        utxos = await client.addressUtxos(address);
    }
    const lockValue = 
      Value.singleAsset(
        faucetTokenPolicyHash,
        Buffer.from(faucetTokenNameHex, 'hex'),
        faucetLockedAmount
    );

    const utxo = utxos?.find(utxo => utxo.resolved.value >= lockValue);
    if (!utxo) {
        throw new Error("No UTxO with required value found in wallet");
    }

    let txBuilder = new TxBuilder (defaultProtocolParameters, defaultMainnetGenesisInfos)

    let tx = txBuilder.buildSync({
        inputs: [{ utxo: utxo }],
        collaterals: [ utxo ],
        outputs: [
            {
                address: faucetAddr,
                value: Value.add(lockValue, Value.lovelaces(minAda)),
                datum: FaucetDatum.FaucetDatum({
                    withdrawalAmount: pIntToData.$(withdrawalAmount),
                    faucetTokenName: pBSToData.$(pByteString(faucetTokenNameHex)), 
                })
            }
        ],
        changeAddress: address
    });
    
    tx.signWith( new PrivateKey(privateKey) );

    const submittedTx = await client.submitTx( tx );

    return {
      status: 200,
      txName: "Lock",
      txId: submittedTx,
      fee: tx.body.fee || 0n,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Lock tx failed: " + err,
    } as ReturnType;
  }
}

/** @internal */
type WithdrawArgs = {
  withdrawalAmount: bigint;
  faucetTokenNameHex: string;
  faucetTokenPolicy: string;
  accessTokenNameHex: string;
  accessTokenPolicy: string;
  client: Emulator | BlockfrostPluts;
};
export async function withdraw({
  withdrawalAmount,
  faucetTokenNameHex,
  faucetTokenPolicy,
  accessTokenNameHex,
  accessTokenPolicy,
  client,
}: WithdrawArgs): Promise<ReturnType> {
  try {
    const privateKeyFile = await readFile("./testnet/payment1.skey", { encoding: "utf-8" });
    const privateKey = PrivateKey.fromCbor( JSON.parse(privateKeyFile).cborHex );
    const publicKeyFile = await readFile("./testnet/payment1.vkey", { encoding: "utf-8" });
    const pkh = PublicKey.fromCbor( JSON.parse(publicKeyFile).cborHex ).hash;
    const addr = await readFile("./testnet/address1.addr", { encoding: "utf-8" });
    const address = Address.fromString(addr);
    
    const accessTokenPolicyHash = new Hash28(accessTokenPolicy);
    const faucetTokenPolicyHash = new Hash28(faucetTokenPolicy);
    const compiledFaucetContract = compile(faucetContract.$(pByteString(accessTokenPolicy)).$(pByteString(faucetTokenPolicy)));
  
    const faucetScript = new Script(
        ScriptType.PlutusV3,
        compiledFaucetContract
    );

    const faucetAddr = new Address(
        isMainnet ? "mainnet" : "testnet",
        Credential.script( faucetScript.hash )
    );
    
    let utxos;
    let scriptUtxos;
    console.log("address: ", address.toString());
    console.log("faucetAddr: ", faucetAddr.toString());
    if (client instanceof Emulator) {
        utxos = client.getAddressUtxos(address);
        scriptUtxos = client.getAddressUtxos(faucetAddr);
    } else {
        utxos = await client.addressUtxos(address);
        scriptUtxos = await client.addressUtxos(faucetAddr);
    }

    const withdrawValue = 
      Value.singleAsset(
        faucetTokenPolicyHash,
        Buffer.from(faucetTokenNameHex, 'hex'),
        withdrawalAmount
    );

    const accessTokenValue = 
    Value.singleAsset(
      accessTokenPolicyHash,
      Buffer.from(accessTokenNameHex, 'hex'),
      1n
    );

    const utxo = utxos?.find(utxo => utxo.resolved.value >= accessTokenValue);
    if (!utxo) {
        throw new Error("No UTxO with required value found in wallet");
    }

    const spareUtxo = utxos?.find(utxo => 
      {
        const lovelaces = utxo.resolved.value.lovelaces;
        const tokenQty = utxo.resolved.value.get(faucetTokenPolicyHash, Buffer.from(faucetTokenNameHex, 'hex'));
        return lovelaces >= minAda && tokenQty == 0n;
      }
    );

    if (!spareUtxo) {
        throw new Error("No spare UTxO with required value found in wallet");
    }

    if (!scriptUtxos) {
        throw new Error("Unable to find utxos at " + addr);
    }

    const scriptUtxo = scriptUtxos.find(utxo => {
        if (utxo.resolved.datum instanceof DataConstr) { 
          const withdrawalAmountData = utxo.resolved.datum.fields[0];
          const faucetTokenNameData = utxo.resolved.datum.fields[1];

          if (withdrawalAmountData instanceof DataI && faucetTokenNameData instanceof DataB) {
              let validTokenName = Buffer.from(faucetTokenNameData.bytes.toBuffer()).toString("hex") == faucetTokenNameHex
              let validWithdrawalAmount = withdrawalAmountData.int == withdrawalAmount
              return validTokenName && validWithdrawalAmount;
          }
        }
        return false; 
    });
    if (!scriptUtxo) {  
        throw new Error ("No script utxo found for the withdrawal amount and token name")
    }

    const scriptUtxoValue = scriptUtxo.resolved.value;

    const remainingValue = 
      Value.singleAsset(
        faucetTokenPolicyHash,
        Buffer.from(faucetTokenNameHex, 'hex'),
        Value.sub(scriptUtxoValue, withdrawValue).get(faucetTokenPolicyHash, Buffer.from(faucetTokenNameHex, 'hex'))
    );

    let txBuilder = new TxBuilder (defaultProtocolParameters, defaultMainnetGenesisInfos)

    let tx = txBuilder.buildSync({
        inputs: [
          { utxo: utxo },
          { utxo: spareUtxo },
          {
            utxo: scriptUtxo,
            inputScript: {
                script: faucetScript,
                datum: "inline",
                redeemer: FaucetRedeemer.Withdraw({
                  senderPkh: pBSToData.$(pByteString(pkh.toBuffer())),
                  accessTokenName: pBSToData.$(pByteString(accessTokenNameHex)), 
              })
            }
        }
        ],
        collaterals: [ utxo ],
        outputs: [
            {
                address: address,
                value: Value.add(Value.add(accessTokenValue, withdrawValue), Value.lovelaces(minAda)),
            },
            {
                address: scriptUtxo.resolved.address,
                value: Value.add(remainingValue, Value.lovelaces(minAda)),
                datum: FaucetDatum.FaucetDatum({
                    withdrawalAmount: pIntToData.$(withdrawalAmount),
                    faucetTokenName: pBSToData.$(pByteString(faucetTokenNameHex)), 
                })
            }
        ],
        changeAddress: address
    });
    
    tx.signWith( new PrivateKey(privateKey) );

    const submittedTx = await client.submitTx( tx );

    return {
      status: 200,
      txName: "Withdraw",
      txId: submittedTx,
      cpu: tx.witnesses?.redeemers?.[0]?.execUnits?.cpu || 0n,
      mem: tx.witnesses?.redeemers?.[0]?.execUnits?.mem || 0n,
      fee: tx.body.fee || 0n,
    } as ReturnType;
  } catch (err) {
    return {
      status: 400,
      msg: "Withdraw tx failed: " + err,
    } as ReturnType;
  }
}