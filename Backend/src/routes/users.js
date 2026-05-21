import { Router } from "express";
import { z } from "zod";
import { getPortfolio } from "../services/portfolio.js";

const router = Router();
const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

router.get("/:wallet/portfolio", async (req, res, next) => {
  try {
    const wallet = walletSchema.parse(req.params.wallet);
    res.json(await getPortfolio(wallet));
  } catch (error) {
    next(error);
  }
});

export default router;
