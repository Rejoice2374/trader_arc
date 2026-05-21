import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), override: true });

export const config = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
  },
  chain: {
    chainId: Number(process.env.ARC_CHAIN_ID || 5042002),
    rpcUrl:
      process.env.ARC_RPC_URL ||
      (process.env.ALCHEMY_API_KEY
        ? `https://arc-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
        : "https://rpc.testnet.arc.network"),
    usdcAddress: process.env.USDC_ADDRESS,
    riskManagerAddress: process.env.RISK_MANAGER_ADDRESS,
    synthraAdapterAddress: process.env.SYNTHRA_ADAPTER_ADDRESS,
    controllerAddress: process.env.TRADER_CONTROLLER_ADDRESS,
    vaultFactoryAddress: process.env.TRADER_VAULT_FACTORY_ADDRESS,
    vaultAddress: process.env.VAULT_CONTRACT_ADDRESS
  }
};
