import { readFile } from "fs/promises";
import {
  Address,
  IUTxO,
  defaultProtocolParameters,
} from "@harmoniclabs/plu-ts";
import { defaultMainnetGenesisInfos } from "@harmoniclabs/buildooor";
import { Emulator, experimentFunctions } from "@harmoniclabs/pluts-emulator";
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";

import { configEnv } from "../config/config";

// Create Client
export let client: Emulator | BlockfrostPluts;

export async function initializeClient() {
  if (configEnv.USE_EMULATOR === "true") {
    const utxosInit: IUTxO[] = [];

    const addr1 = await readFile("./keys/address1.addr", {
      encoding: "utf-8",
    });
    const address1 = Address.fromString(addr1);
    const utxoHash1 = experimentFunctions.generateRandomTxHash(1);
    const utxo1: IUTxO = experimentFunctions.createInitialUTxO(
      100_000_000n,
      address1,
      utxoHash1,
    );
    utxosInit.push(utxo1);

    return new Emulator(
      utxosInit,
      defaultMainnetGenesisInfos,
      defaultProtocolParameters,
    );
  } else {
    return new BlockfrostPluts({
      projectId: configEnv.BLOCKFROST_API_KEY || "",
    });
  }
}
