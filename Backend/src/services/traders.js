import { pool } from "../db/pool.js";

export async function listTraders() {
  const [rows] = await pool.query(
    "SELECT id, wallet_address, status, roi_bps, win_rate_bps, drawdown_bps, risk_score, strategy_description FROM traders ORDER BY roi_bps DESC, id DESC"
  );
  return rows;
}

export async function getTrader(id) {
  const [rows] = await pool.execute("SELECT * FROM traders WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createTraderApplication(input) {
  const [result] = await pool.execute(
    `INSERT INTO traders (wallet_address, experience, strategy_description, past_performance)
     VALUES (?, ?, ?, ?)`,
    [input.walletAddress.toLowerCase(), input.experience, input.strategyDescription, input.pastPerformance || null]
  );
  return getTrader(result.insertId);
}
