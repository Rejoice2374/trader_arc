import { pool } from "../db/pool.js";

export async function getPortfolio(wallet) {
  const normalized = wallet.toLowerCase();
  const [users] = await pool.execute(
    "SELECT id, wallet_address FROM users WHERE wallet_address = ?",
    [normalized],
  );
  if (!users[0]) {
    return {
      wallet: normalized,
      totalDeposited: "0",
      activeVaults: [],
      deposits: [],
    };
  }

  const [deposits] = await pool.execute(
    `SELECT d.*, v.contract_address, t.wallet_address AS trader_wallet
     FROM deposits d
     JOIN vaults v ON v.id = d.vault_id
     JOIN traders t ON t.id = v.trader_id
     WHERE d.user_id = ?
     ORDER BY d.created_at DESC`,
    [users[0].id],
  );

  const totalDeposited = deposits
    .reduce((sum, row) => sum + Number(row.amount), 0)
    .toFixed(6);
  return {
    wallet: normalized,
    totalDeposited,
    activeVaults: [...new Set(deposits.map((row) => row.vault_id))],
    deposits,
  };
}
