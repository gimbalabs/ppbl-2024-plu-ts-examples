import { readFile } from "fs/promises";
import { Address, IUTxO, defaultProtocolParameters } from "@harmoniclabs/plu-ts";
import { defaultMainnetGenesisInfos } from "@harmoniclabs/buildooor";
import { Emulator, experimentFunctions } from '@harmoniclabs/pluts-emulator';
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";

import { configEnv } from "../config/config";

// Define the Cardano Network
export const isMainnet = false;

// Create Client
export let client: Emulator | BlockfrostPluts;

export async function initializeClient() {
  if (configEnv.USE_EMULATOR === 'true') {

    const utxosInit: IUTxO[] = [];

    const addr1 = await readFile("./testnet/address1.addr", { encoding: "utf-8" });
    const address1 = Address.fromString(addr1);
    const utxoHash1 = experimentFunctions.generateRandomTxHash(1);
    const utxo1: IUTxO = experimentFunctions.createInitialUTxO(100_000_000n, address1, utxoHash1);
    utxosInit.push(utxo1);

    //const addr2 = await readFile("./testnet/address2.addr", { encoding: "utf-8" });
    //const address2 = Address.fromString(addr2);
    //const utxoHash2 = experimentFunctions.generateRandomTxHash(2);
    //const utxo2: IUTxO = experimentFunctions.createInitialUTxO(100_000_000n, address2, utxoHash2);
    //utxosInit.push(utxo2);

    return new Emulator(utxosInit, defaultMainnetGenesisInfos, defaultProtocolParameters);
  } else {
    return new BlockfrostPluts({
        projectId: configEnv.BLOCKFROST_API_KEY || ""
    });
  }
}

