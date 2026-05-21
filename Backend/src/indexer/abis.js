export const factoryAbi = [
  "event TraderVaultCreated(address indexed trader, address indexed vault, string name, string symbol)",
  "function createVault(string name, string symbol) returns (address vault)",
  "function allVaults(uint256) view returns (address)",
  "function allVaultsLength() view returns (uint256)",
  "function traderVaults(address trader, uint256) view returns (address)",
  "function traderVaultsLength(address trader) view returns (uint256)",
  "function asset() view returns (address)",
  "function controller() view returns (address)"
];

export const vaultAbi = [
  "event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
  "event TradeRequested(address indexed trader, bytes32 indexed market, bool isLong, uint256 collateral, uint256 leverageBps, uint256 sizeUsd)",
  "function asset() view returns (address)",
  "function trader() view returns (address)",
  "function controller() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
  "function requestTrade(uint256 collateral, uint256 leverageBps, bytes32 market, bool isLong)"
];

export const controllerAbi = [
  "event TraderApprovalChanged(address indexed trader, bool approved)",
  "event VaultFactoryChanged(address indexed previousFactory, address indexed newFactory)",
  "event VaultRegistered(address indexed vault, address indexed trader)",
  "event RiskLimitsUpdated(uint256 maxLeverageBps, uint256 maxVaultExposureBps)",
  "event TradeExecuted(address indexed vault, address indexed trader, bytes32 indexed market, bool isLong, uint256 collateral, uint256 leverageBps, uint256 sizeUsd)",
  "event TradeClosed(address indexed vault, address indexed trader, bytes32 indexed market, int256 pnl, uint256 lossBps)",
  "function approvedTraders(address trader) view returns (bool)",
  "function approvedVaults(address vault) view returns (bool)",
  "function vaultTrader(address vault) view returns (address)",
  "function vaultFactory() view returns (address)",
  "function riskManager() view returns (address)",
  "function adapter() view returns (address)",
  "function maxLeverageBps() view returns (uint256)",
  "function maxVaultExposureBps() view returns (uint256)",
  "function cooldownDuration() view returns (uint256)",
  "function lossCooldownThresholdBps() view returns (uint256)"
];

export const riskManagerAbi = [
  "event VaultPaused(address indexed vault, string reason)",
  "event VaultUnpaused(address indexed vault)",
  "function pausedVaults(address vault) view returns (bool)"
];
