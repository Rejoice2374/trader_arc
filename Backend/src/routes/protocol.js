import { Router } from "express";
import { config } from "../config.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    chainId: config.chain.chainId,
    rpcUrl: config.chain.rpcUrl,
    usdcAddress: config.chain.usdcAddress,
    riskManagerAddress: config.chain.riskManagerAddress,
    synthraAdapterAddress: config.chain.synthraAdapterAddress,
    traderControllerAddress: config.chain.controllerAddress,
    traderVaultFactoryAddress: config.chain.vaultFactoryAddress
  });
});

export default router;
