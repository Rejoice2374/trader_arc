import { ethers } from "ethers";
import { config } from "../config.js";
import { upsertVaultFromChain } from "../services/vaults.js";
import { controllerAbi, factoryAbi, riskManagerAbi, vaultAbi } from "./abis.js";

const provider = new ethers.JsonRpcProvider(config.chain.rpcUrl);
const watchedVaults = new Set();

async function watchVault(vaultAddress) {
  const normalized = vaultAddress.toLowerCase();
  if (watchedVaults.has(normalized)) return;
  watchedVaults.add(normalized);

  const vault = new ethers.Contract(vaultAddress, vaultAbi, provider);

  vault.on("Deposit", (caller, owner, assets, shares, event) => {
    console.log("Deposit", {
      vault: vaultAddress,
      caller,
      owner,
      assets: ethers.formatUnits(assets, 6),
      shares: ethers.formatUnits(shares, 18),
      txHash: event.log.transactionHash
    });
  });

  vault.on("Withdraw", (caller, receiver, owner, assets, shares, event) => {
    console.log("Withdraw", {
      vault: vaultAddress,
      caller,
      receiver,
      owner,
      assets: ethers.formatUnits(assets, 6),
      shares: ethers.formatUnits(shares, 18),
      txHash: event.log.transactionHash
    });
  });

  vault.on("TradeRequested", (trader, market, isLong, collateral, leverageBps, sizeUsd, event) => {
    console.log("TradeRequested", {
      vault: vaultAddress,
      trader,
      market: ethers.decodeBytes32String(market),
      side: isLong ? "long" : "short",
      collateral: ethers.formatUnits(collateral, 6),
      leverageBps: leverageBps.toString(),
      sizeUsd: ethers.formatUnits(sizeUsd, 6),
      txHash: event.log.transactionHash
    });
  });

  console.log(`Watching vault ${vaultAddress}`);
}

if (config.chain.vaultFactoryAddress) {
  const factory = new ethers.Contract(config.chain.vaultFactoryAddress, factoryAbi, provider);

  factory.on("TraderVaultCreated", async (trader, vault, name, symbol, event) => {
    console.log("TraderVaultCreated", { trader, vault, name, symbol, txHash: event.log.transactionHash });
    try {
      await upsertVaultFromChain({ traderWallet: trader, vaultAddress: vault });
      await watchVault(vault);
    } catch (error) {
      console.error("Failed to persist created vault", error);
    }
  });

  const vaultCount = Number(await factory.allVaultsLength());
  for (let index = 0; index < vaultCount; index += 1) {
    const vaultAddress = await factory.allVaults(index);
    const vault = new ethers.Contract(vaultAddress, vaultAbi, provider);
    const trader = await vault.trader();
    await upsertVaultFromChain({ traderWallet: trader, vaultAddress });
    await watchVault(vaultAddress);
  }
}

if (config.chain.vaultAddress) {
  await watchVault(config.chain.vaultAddress);
}

if (config.chain.controllerAddress) {
  const controller = new ethers.Contract(config.chain.controllerAddress, controllerAbi, provider);

  controller.on("TradeExecuted", (vault, trader, market, isLong, collateral, leverageBps, sizeUsd, event) => {
    console.log("TradeExecuted", {
      vault,
      trader,
      market: ethers.decodeBytes32String(market),
      side: isLong ? "long" : "short",
      collateral: ethers.formatUnits(collateral, 6),
      leverageBps: leverageBps.toString(),
      sizeUsd: ethers.formatUnits(sizeUsd, 6),
      txHash: event.log.transactionHash
    });
  });

  controller.on("TradeClosed", (vault, trader, market, pnl, lossBps, event) => {
    console.log("TradeClosed", {
      vault,
      trader,
      market: ethers.decodeBytes32String(market),
      pnl: ethers.formatUnits(pnl, 6),
      lossBps: lossBps.toString(),
      txHash: event.log.transactionHash
    });
  });

  controller.on("TraderApprovalChanged", (trader, approved, event) => {
    console.log("TraderApprovalChanged", { trader, approved, txHash: event.log.transactionHash });
  });
}

if (config.chain.riskManagerAddress) {
  const riskManager = new ethers.Contract(config.chain.riskManagerAddress, riskManagerAbi, provider);

  riskManager.on("VaultPaused", (vault, reason, event) => {
    console.log("VaultPaused", { vault, reason, txHash: event.log.transactionHash });
  });

  riskManager.on("VaultUnpaused", (vault, event) => {
    console.log("VaultUnpaused", { vault, txHash: event.log.transactionHash });
  });
}

console.log("TradeArc indexer listening for contract events.");
