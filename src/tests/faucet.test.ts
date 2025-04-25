import { readFile } from "fs/promises";
import { UTxO, Value } from "@harmoniclabs/plu-ts";
import { Emulator } from "@harmoniclabs/pluts-emulator";
import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";
import { Address } from "@harmoniclabs/plu-ts";
import {
  afterAll,
  afterEach,
  assert,
  beforeAll,
  describe,
  expect,
  test,
} from "vitest";

import { initializeClient } from "./client";
import { lock, mint, withdraw } from "./offchain";
import { generateReport } from "./utils";
import { configEnv } from "../config/config";
import { ReturnType } from "./types";

let client: Emulator | BlockfrostPluts;

describe("Faucet", () => {
  let exCosts = [] as ReturnType[];
  let accessTokenNameHex: string = configEnv.ACCESS_TOKEN_NAME_HEX || "";
  let accessTokenPolicy: string = configEnv.ACCESS_TOKEN_POLICY || "";
  let faucetTokenNameHex: string = configEnv.FAUCET_TOKEN_NAME_HEX || "";
  let faucetTokenPolicy: string = configEnv.FAUCET_TOKEN_POLICY || "";

  const withdrawalAmount = 100n;
  const faucetLockedAmount = 1000000n;

  // Setup code that runs once before all tests
  beforeAll(async () => {
    console.log("E2E Faucet Test - START");
    client = await initializeClient();
  });

  // Cleanup code that runs once after all tests
  afterAll(async () => {
    if (client instanceof Emulator) {
      client.printAllUTXOs();
    }
    generateReport(exCosts);
    console.log("E2E Faucet Test - END");
  });

  afterEach(async () => {
    if (client instanceof Emulator) {
      client.awaitBlock(1);
    } else {
      // wait for block confirmations
    }
  });

  test("Mint Access Token", async () => {
    console.log("\n--- Before Mint Access Token Tx ---");

    const result = await mint({
      tokenName: "access-token",
      tokenQty: 1n,
      client,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);

    accessTokenNameHex = result.tokenNameHex ?? "";
    accessTokenPolicy = result.mintingPolicy ?? "";
    console.log("\n--- After Mint Access Token Tx ---");
  }, 1000000);

  test("Mint Faucet Token", async () => {
    console.log("\n--- Before Mint Faucet Token Tx ---");

    const result = await mint({
      tokenName: "faucet-token",
      tokenQty: 1000000n,
      client,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);

    faucetTokenNameHex = result.tokenNameHex ?? "";
    faucetTokenPolicy = result.mintingPolicy ?? "";
    console.log("\n--- After Mint Faucet Token Tx ---");
  }, 1000000);

  test("Lock Faucet Token", async () => {
    console.log("\n--- Before Lock Faucet Token Tx ---");

    const result = await lock({
      withdrawalAmount,
      faucetLockedAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenPolicy,
      client,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Lock Faucet Token Tx ---");
  }, 1000000);

  test("Withdraw Faucet Token 1", async () => {
    console.log("\n--- Before Withdraw Faucet Token Tx ---");

    const result = await withdraw({
      withdrawalAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenNameHex,
      accessTokenPolicy,
      client,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Withdraw Faucet Token Tx ---");
  }, 1000000);

  test("Withdraw Faucet Token 2", async () => {
    console.log("\n--- Before Withdraw Faucet Token Tx ---");

    const result = await withdraw({
      withdrawalAmount,
      faucetTokenNameHex,
      faucetTokenPolicy,
      accessTokenNameHex,
      accessTokenPolicy,
      client,
    });
    console.log({ result });
    expect(result.status == 200).toBeTruthy();
    exCosts.push(result);
    console.log("\n--- After Withdraw Faucet Token Tx ---");
  }, 1000000);

  test("Check Wallet Balance", async () => {
    const addr = await readFile("./testnet/address1.addr", {
      encoding: "utf-8",
    });
    const address = Address.fromString(addr);

    let utxos: UTxO[] | undefined;
    if (client instanceof Emulator) {
      utxos = client.getAddressUtxos(address);
    } else {
      utxos = await client.addressUtxos(address);
    }

    if (!utxos) {
      throw new Error("No UTxOs found for address " + address);
    }

    const walletValueEnd = utxos.reduce(
      (amount, utxo) => Value.add(amount, utxo.resolved.value),
      Value.lovelaces(0n),
    );

    assert(
      walletValueEnd.get(
        accessTokenPolicy,
        Buffer.from(accessTokenNameHex, "hex"),
      ) == 1n,
      "Access token balance is not 1",
    );
    assert(
      walletValueEnd.get(
        faucetTokenPolicy,
        Buffer.from(faucetTokenNameHex, "hex"),
      ) == 200n,
      "Faucet token balance is not 200",
    );
  }, 1000000);
});
