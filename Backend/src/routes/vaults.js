import { Router } from "express";
import { getVault, getVaultTrades, listVaults } from "../services/vaults.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listVaults());
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const vault = await getVault(req.params.id);
    if (!vault) return res.status(404).json({ error: "Vault not found" });
    const trades = await getVaultTrades(req.params.id);
    res.json({ ...vault, trades });
  } catch (error) {
    next(error);
  }
});

export default router;
