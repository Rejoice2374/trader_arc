import React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { encodeFunctionData, numberToHex } from "viem";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  BriefcaseBusiness,
  Landmark,
  LayoutDashboard,
  LogIn,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getPortfolio,
  getProtocol,
  getTraders,
  getVaults,
  submitTraderApplication,
} from "./api.js";

const factoryAbi = [
  {
    type: "function",
    name: "createVault",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [{ name: "vault", type: "address" }],
  },
];

const fallbackTraders = [
  {
    id: 1,
    wallet_address: "0x9f2c...b113",
    status: "approved",
    roi_bps: 1840,
    win_rate_bps: 6420,
    drawdown_bps: 710,
    risk_score: 38,
    strategy_description: "ETH and BTC momentum with strict exposure caps.",
  },
  {
    id: 2,
    wallet_address: "0x71ad...5c02",
    status: "approved",
    roi_bps: 920,
    win_rate_bps: 5880,
    drawdown_bps: 440,
    risk_score: 27,
    strategy_description:
      "Low leverage majors strategy focused on capital preservation.",
  },
];

const fallbackVaults = [
  {
    id: 1,
    contract_address: "0xVault...01",
    trader_wallet: "0x9f2c...b113",
    total_assets: "125430.000000",
    roi_bps: 1840,
    drawdown_bps: 710,
    risk_score: 38,
    status: "active",
  },
  {
    id: 2,
    contract_address: "0xVault...02",
    trader_wallet: "0x71ad...5c02",
    total_assets: "58920.000000",
    roi_bps: 920,
    drawdown_bps: 440,
    risk_score: 27,
    status: "active",
  },
];

function formatBps(value) {
  return `${(Number(value || 0) / 100).toFixed(2)}%`;
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function App() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [view, setView] = useState("dashboard");
  const [traders, setTraders] = useState(fallbackTraders);
  const [vaults, setVaults] = useState(fallbackVaults);
  const [portfolio, setPortfolio] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [formState, setFormState] = useState({
    experience: "",
    strategyDescription: "",
    pastPerformance: "",
  });
  const [vaultForm, setVaultForm] = useState({
    name: "TradeArc Vault",
    symbol: "TAV",
  });
  const [txStatus, setTxStatus] = useState("");
  const wallet = user?.wallet?.address;

  useEffect(() => {
    getTraders()
      .then(setTraders)
      .catch(() => setTraders(fallbackTraders));
    getVaults()
      .then(setVaults)
      .catch(() => setVaults(fallbackVaults));
    getProtocol()
      .then(setProtocol)
      .catch(() => setProtocol(null));
  }, []);

  useEffect(() => {
    if (wallet) {
      getPortfolio(wallet)
        .then(setPortfolio)
        .catch(() => setPortfolio(null));
    }
  }, [wallet]);

  const totals = useMemo(() => {
    const totalAssets = vaults.reduce(
      (sum, vault) => sum + Number(vault.total_assets || 0),
      0,
    );
    const averageRoi = vaults.length
      ? vaults.reduce((sum, vault) => sum + Number(vault.roi_bps || 0), 0) /
        vaults.length
      : 0;
    return { totalAssets, averageRoi };
  }, [vaults]);

  async function handleTraderApply(event) {
    event.preventDefault();
    if (!wallet) return;
    await submitTraderApplication({ walletAddress: wallet, ...formState });
    setFormState({
      experience: "",
      strategyDescription: "",
      pastPerformance: "",
    });
  }

  async function handleCreateVault(event) {
    event.preventDefault();
    if (!wallet || !protocol?.traderVaultFactoryAddress) return;
    if (!window.ethereum) {
      setTxStatus("No browser wallet provider found.");
      return;
    }

    setTxStatus("Waiting for wallet confirmation...");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: numberToHex(protocol.chainId) }],
      });
    } catch (switchError) {
      if (switchError?.code !== 4902) {
        setTxStatus(switchError?.message || "Could not switch to Arc Testnet.");
        return;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: numberToHex(protocol.chainId),
            chainName: "Arc Testnet",
            rpcUrls: [protocol.rpcUrl],
            nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          },
        ],
      });
    }

    try {
      const data = encodeFunctionData({
        abi: factoryAbi,
        functionName: "createVault",
        args: [vaultForm.name, vaultForm.symbol],
      });

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          { from: wallet, to: protocol.traderVaultFactoryAddress, data },
        ],
      });

      setTxStatus(`Vault creation submitted: ${txHash}`);
    } catch (error) {
      setTxStatus(
        error?.shortMessage || error?.message || "Vault creation failed.",
      );
    }
  }

  if (!ready) {
    return <div className="loading">Loading TradeArc</div>;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Landmark size={26} />
          <span>TradeArc</span>
        </div>
        <nav>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            className={view === "marketplace" ? "active" : ""}
            onClick={() => setView("marketplace")}
          >
            <BarChart3 size={18} /> Marketplace
          </button>
          <button
            className={view === "vaults" ? "active" : ""}
            onClick={() => setView("vaults")}
          >
            <BriefcaseBusiness size={18} /> Vaults
          </button>
          <button
            className={view === "trader" ? "active" : ""}
            onClick={() => setView("trader")}
          >
            <TrendingUp size={18} /> Trader Panel
          </button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Arc Testnet copy trading vaults</p>
            <h1>{viewLabels[view]}</h1>
          </div>
          {authenticated ? (
            <button className="wallet-button" onClick={logout}>
              <Wallet size={18} /> {wallet?.slice(0, 6)}...{wallet?.slice(-4)}
            </button>
          ) : (
            <button className="wallet-button" onClick={login}>
              <LogIn size={18} /> Connect
            </button>
          )}
        </header>

        {view === "dashboard" && (
          <Dashboard
            totals={totals}
            portfolio={portfolio}
            vaults={vaults}
            protocol={protocol}
          />
        )}
        {view === "marketplace" && <Marketplace traders={traders} />}
        {view === "vaults" && <Vaults vaults={vaults} />}
        {view === "trader" && (
          <TraderPanel
            authenticated={authenticated}
            formState={formState}
            setFormState={setFormState}
            handleTraderApply={handleTraderApply}
            vaultForm={vaultForm}
            setVaultForm={setVaultForm}
            handleCreateVault={handleCreateVault}
            txStatus={txStatus}
            factoryAddress={protocol?.traderVaultFactoryAddress}
          />
        )}
      </section>
    </main>
  );
}

const viewLabels = {
  dashboard: "Dashboard",
  marketplace: "Trader Marketplace",
  vaults: "Vaults",
  trader: "Trader Panel",
};

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not set";
}

function Dashboard({ totals, portfolio, vaults, protocol }) {
  return (
    <div className="content-grid">
      <Metric
        icon={<Landmark />}
        label="Vault liquidity"
        value={formatUsd(totals.totalAssets)}
      />
      <Metric
        icon={<TrendingUp />}
        label="Average ROI"
        value={formatBps(totals.averageRoi)}
      />
      <Metric
        icon={<BriefcaseBusiness />}
        label="Active vaults"
        value={vaults.length}
      />
      <Metric
        icon={<Wallet />}
        label="Your deposits"
        value={formatUsd(portfolio?.totalDeposited || 0)}
      />
      <section className="panel wide">
        <h2>Active Vaults</h2>
        <VaultTable vaults={vaults.slice(0, 5)} />
      </section>
      <section className="panel wide">
        <h2>Protocol Contracts</h2>
        <div className="contract-grid">
          <AddressBlock
            label="Factory"
            value={protocol?.traderVaultFactoryAddress}
          />
          <AddressBlock
            label="Controller"
            value={protocol?.traderControllerAddress}
          />
          <AddressBlock
            label="Risk Manager"
            value={protocol?.riskManagerAddress}
          />
          <AddressBlock
            label="Synthra Adapter"
            value={protocol?.synthraAdapterAddress}
          />
        </div>
      </section>
    </div>
  );
}

function Marketplace({ traders }) {
  return (
    <div className="card-grid">
      {traders.map((trader) => (
        <article className="data-card" key={trader.id}>
          <div className="card-heading">
            <h2>{trader.wallet_address}</h2>
            <span className={`status ${trader.status}`}>{trader.status}</span>
          </div>
          <p>{trader.strategy_description}</p>
          <div className="stats-row">
            <span>
              ROI <strong>{formatBps(trader.roi_bps)}</strong>
            </span>
            <span>
              Win rate <strong>{formatBps(trader.win_rate_bps)}</strong>
            </span>
            <span>
              Drawdown <strong>{formatBps(trader.drawdown_bps)}</strong>
            </span>
          </div>
          <div className="risk-line">
            <ShieldAlert size={16} /> Risk score {trader.risk_score}/100
          </div>
        </article>
      ))}
    </div>
  );
}

function Vaults({ vaults }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Vault Performance</h2>
        <div className="actions">
          <button>
            <ArrowDownToLine size={17} /> Deposit
          </button>
          <button>
            <ArrowUpFromLine size={17} /> Withdraw
          </button>
        </div>
      </div>
      <VaultTable vaults={vaults} />
    </section>
  );
}

function TraderPanel({
  authenticated,
  formState,
  setFormState,
  handleTraderApply,
  vaultForm,
  setVaultForm,
  handleCreateVault,
  txStatus,
  factoryAddress,
}) {
  return (
    <div className="trader-layout">
      <section className="panel">
        <h2>Become a trader</h2>
        <form onSubmit={handleTraderApply}>
          <label>
            Trading experience
            <textarea
              value={formState.experience}
              onChange={(event) =>
                setFormState({ ...formState, experience: event.target.value })
              }
              minLength={10}
              required
            />
          </label>
          <label>
            Strategy description
            <textarea
              value={formState.strategyDescription}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  strategyDescription: event.target.value,
                })
              }
              minLength={20}
              required
            />
          </label>
          <label>
            Past performance
            <textarea
              value={formState.pastPerformance}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  pastPerformance: event.target.value,
                })
              }
            />
          </label>
          <button disabled={!authenticated} type="submit">
            Submit application
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Create vault</h2>
        <form onSubmit={handleCreateVault}>
          <label>
            Vault name
            <input
              value={vaultForm.name}
              onChange={(event) =>
                setVaultForm({ ...vaultForm, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Share symbol
            <input
              value={vaultForm.symbol}
              onChange={(event) =>
                setVaultForm({
                  ...vaultForm,
                  symbol: event.target.value.toUpperCase(),
                })
              }
              maxLength={12}
              required
            />
          </label>
          <div className="contract-note">
            Factory {shortAddress(factoryAddress)}
          </div>
          <button disabled={!authenticated || !factoryAddress} type="submit">
            <BriefcaseBusiness size={17} /> Create vault
          </button>
          {txStatus && <p className="tx-status">{txStatus}</p>}
        </form>
      </section>
      <section className="panel">
        <h2>Trade controls</h2>
        <div className="trade-ticket">
          <label>
            Market
            <input placeholder="ETH-USD" />
          </label>
          <label>
            Collateral
            <input placeholder="1000 USDC" />
          </label>
          <label>
            Leverage
            <input placeholder="3x" />
          </label>
          <div className="actions">
            <button>
              <TrendingUp size={17} /> Open Long
            </button>
            <button>
              <ArrowUpFromLine size={17} /> Close
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AddressBlock({ label, value }) {
  return (
    <div className="address-block">
      <span>{label}</span>
      <strong title={value || ""}>{shortAddress(value)}</strong>
    </div>
  );
}

function VaultTable({ vaults }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Vault</th>
            <th>Trader</th>
            <th>Assets</th>
            <th>ROI</th>
            <th>Drawdown</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {vaults.map((vault) => (
            <tr key={vault.id}>
              <td>{vault.contract_address}</td>
              <td>{vault.trader_wallet}</td>
              <td>{formatUsd(vault.total_assets)}</td>
              <td>{formatBps(vault.roi_bps)}</td>
              <td>{formatBps(vault.drawdown_bps)}</td>
              <td>{vault.risk_score}/100</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <section className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
