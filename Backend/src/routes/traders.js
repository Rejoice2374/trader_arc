import { Router } from "express";
import { z } from "zod";
import { createTraderApplication, getTrader, listTraders } from "../services/traders.js";

const router = Router();
const applicationSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  experience: z.string().min(10),
  strategyDescription: z.string().min(20),
  pastPerformance: z.string().optional()
});

router.get("/", async (_req, res, next) => {
  try {
    res.json(await listTraders());
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const trader = await getTrader(req.params.id);
    if (!trader) return res.status(404).json({ error: "Trader not found" });
    res.json(trader);
  } catch (error) {
    next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const input = applicationSchema.parse(req.body);
    res.status(201).json(await createTraderApplication(input));
  } catch (error) {
    next(error);
  }
});

export default router;
