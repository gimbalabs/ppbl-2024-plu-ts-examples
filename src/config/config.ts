import * as dotenv from "dotenv";

// Load .env file contents into process.env
dotenv.config();

interface EnvConfig {
  IS_MAINNET: string;
  USE_EMULATOR: string;
  BLOCKFROST_API_KEY: string;
  ACCESS_TOKEN_NAME_HEX: string;
  ACCESS_TOKEN_POLICY: string;
  FAUCET_TOKEN_NAME_HEX: string;
  FAUCET_TOKEN_POLICY: string;
}

// Validate that all required environment variables are present
function validateEnv(): EnvConfig {
  const requiredEnvVars: (keyof EnvConfig)[] = [
    "IS_MAINNET",
    "USE_EMULATOR",
    "BLOCKFROST_API_KEY",
    "ACCESS_TOKEN_NAME_HEX",
    "ACCESS_TOKEN_POLICY",
    "FAUCET_TOKEN_NAME_HEX",
    "FAUCET_TOKEN_POLICY",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    IS_MAINNET: process.env.IS_MAINNET!,
    USE_EMULATOR: process.env.USE_EMULATOR!,
    BLOCKFROST_API_KEY: process.env.BLOCKFROST_API_KEY!,
    ACCESS_TOKEN_NAME_HEX: process.env.ACCESS_TOKEN_NAME_HEX!,
    ACCESS_TOKEN_POLICY: process.env.ACCESS_TOKEN_POLICY!,
    FAUCET_TOKEN_NAME_HEX: process.env.FAUCET_TOKEN_NAME_HEX!,
    FAUCET_TOKEN_POLICY: process.env.FAUCET_TOKEN_POLICY!,
  };
}

export const configEnv = validateEnv();
