import { pool } from "../db/pool.js";

export async function upsertVaultFromChain({ traderWallet, vaultAddress }) {
  const wallet = traderWallet.toLowerCase();
  const vault = vaultAddress.toLowerCase();

  const [traderRows] = await pool.execute("SELECT id FROM traders WHERE wallet_address = ?", [wallet]);
  let traderId = traderRows[0]?.id;

  if (!traderId) {
    const [result] = await pool.execute(
      `INSERT INTO traders (wallet_address, experience, strategy_description, status)
       VALUES (?, ?, ?, 'approved')`,
      [wallet, "Created from on-chain vault factory event.", "On-chain trader vault."]
    );
    traderId = result.insertId;
  }

  await pool.execute(
    `INSERT INTO vaults (trader_id, contract_address)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE trader_id = VALUES(trader_id), status = 'active'`,
    [traderId, vault]
  );
}

export async function listVaults() {
  const [rows] = await pool.query(
    `SELECT v.*, t.wallet_address AS trader_wallet, t.roi_bps, t.drawdown_bps, t.risk_score
     FROM vaults v
     JOIN traders t ON t.id = v.trader_id
     ORDER BY v.total_assets DESC`
  );
  return rows;
}

export async function getVault(id) {
  const [rows] = await pool.execute(
    `SELECT v.*, t.wallet_address AS trader_wallet, t.strategy_description, t.roi_bps, t.win_rate_bps, t.drawdown_bps, t.risk_score
     FROM vaults v
     JOIN traders t ON t.id = v.trader_id
     WHERE v.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function getVaultTrades(id) {
  const [rows] = await pool.execute("SELECT * FROM trades WHERE vault_id = ? ORDER BY opened_at DESC LIMIT 100", [id]);
  return rows;
}

export async function findVaultByAddress(vaultAddress) {
  const [rows] = await pool.execute("SELECT * FROM vaults WHERE contract_address = ?", [vaultAddress.toLowerCase()]);
  return rows[0] || null;
}
