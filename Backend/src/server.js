import cors from "cors";
import express from "express";
import { config } from "./config.js";
import db from "./config/db.js";
import protocolRouter from "./routes/protocol.js";
import tradersRouter from "./routes/traders.js";
import usersRouter from "./routes/users.js";
import vaultsRouter from "./routes/vaults.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "tradearc-backend" });
});

app.use("/protocol", protocolRouter);
app.use("/traders", tradersRouter);
app.use("/vaults", vaultsRouter);
app.use("/user", usersRouter);

app.use((error, _req, res, _next) => {
  if (error?.issues) {
    return res
      .status(400)
      .json({ error: "Validation failed", issues: error.issues });
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`TradeArc backend listening on port ${config.port}`);
});
