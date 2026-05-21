// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RiskManager} from "./RiskManager.sol";
import {SynthraAdapter} from "./SynthraAdapter.sol";

contract TraderController {
    uint256 public constant BPS = 10_000;

    address public owner;
    address public vaultFactory;
    RiskManager public riskManager;
    SynthraAdapter public adapter;

    uint256 public maxLeverageBps = 50_000;
    uint256 public maxVaultExposureBps = 2_000;
    uint256 public cooldownDuration = 1 days;
    uint256 public lossCooldownThresholdBps = 2_000;

    mapping(address => bool) public approvedTraders;
    mapping(address => bool) public approvedVaults;
    mapping(address => address) public vaultTrader;
    mapping(address => uint256) public lastLargeLossAt;

    event TraderApprovalChanged(address indexed trader, bool approved);
    event VaultFactoryChanged(address indexed previousFactory, address indexed newFactory);
    event VaultRegistered(address indexed vault, address indexed trader);
    event RiskLimitsUpdated(uint256 maxLeverageBps, uint256 maxVaultExposureBps);
    event TradeExecuted(
        address indexed vault,
        address indexed trader,
        bytes32 indexed market,
        bool isLong,
        uint256 collateral,
        uint256 leverageBps,
        uint256 sizeUsd
    );
    event TradeClosed(
        address indexed vault, address indexed trader, bytes32 indexed market, int256 pnl, uint256 lossBps
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyOwnerOrFactory() {
        require(msg.sender == owner || msg.sender == vaultFactory, "NOT_OWNER_OR_FACTORY");
        _;
    }

    constructor(RiskManager riskManager_, SynthraAdapter adapter_, address initialOwner) {
        require(address(riskManager_) != address(0), "ZERO_RISK");
        require(address(adapter_) != address(0), "ZERO_ADAPTER");
        require(initialOwner != address(0), "ZERO_OWNER");
        riskManager = riskManager_;
        adapter = adapter_;
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function setTraderApproval(address trader, bool approved) external onlyOwner {
        require(trader != address(0), "ZERO_TRADER");
        approvedTraders[trader] = approved;
        emit TraderApprovalChanged(trader, approved);
    }

    function setVaultFactory(address newFactory) external onlyOwner {
        emit VaultFactoryChanged(vaultFactory, newFactory);
        vaultFactory = newFactory;
    }

    function registerVault(address vault, address trader) external onlyOwnerOrFactory {
        require(vault != address(0), "ZERO_VAULT");
        require(trader != address(0), "ZERO_TRADER");
        require(approvedTraders[trader], "TRADER_NOT_APPROVED");
        approvedVaults[vault] = true;
        vaultTrader[vault] = trader;
        emit VaultRegistered(vault, trader);
    }

    function setRiskLimits(uint256 maxLeverageBps_, uint256 maxVaultExposureBps_) external onlyOwner {
        require(maxLeverageBps_ >= BPS, "LEVERAGE_TOO_LOW");
        require(maxVaultExposureBps_ <= BPS, "EXPOSURE_TOO_HIGH");
        maxLeverageBps = maxLeverageBps_;
        maxVaultExposureBps = maxVaultExposureBps_;
        emit RiskLimitsUpdated(maxLeverageBps_, maxVaultExposureBps_);
    }

    function setCooldown(uint256 duration, uint256 lossThresholdBps) external onlyOwner {
        require(lossThresholdBps <= BPS, "BAD_THRESHOLD");
        cooldownDuration = duration;
        lossCooldownThresholdBps = lossThresholdBps;
    }

    function assertCanTrade(address vault, address trader, uint256 collateral, uint256 leverageBps) public view {
        require(approvedVaults[vault], "VAULT_NOT_APPROVED");
        require(vaultTrader[vault] == trader, "TRADER_VAULT_MISMATCH");
        require(approvedTraders[trader], "TRADER_NOT_APPROVED");
        require(!riskManager.pausedVaults(vault), "VAULT_PAUSED");
        require(leverageBps <= maxLeverageBps, "LEVERAGE_LIMIT");
        uint256 cooldownStart = lastLargeLossAt[vault];
        require(cooldownStart == 0 || block.timestamp >= cooldownStart + cooldownDuration, "COOLDOWN");

        uint256 vaultAssets = _vaultAssets(vault);
        require(vaultAssets > 0, "EMPTY_VAULT");
        require((collateral * BPS) / vaultAssets <= maxVaultExposureBps, "EXPOSURE_LIMIT");
    }

    function recordTrade(
        address vault,
        address trader,
        uint256 collateral,
        uint256 leverageBps,
        bytes32 market,
        bool isLong
    ) external {
        require(msg.sender == vault, "ONLY_VAULT");
        assertCanTrade(vault, trader, collateral, leverageBps);
        uint256 sizeUsd = (collateral * leverageBps) / BPS;
        adapter.openPosition(
            SynthraAdapter.PositionRequest({
                vault: vault,
                trader: trader,
                market: market,
                isLong: isLong,
                collateral: collateral,
                leverageBps: leverageBps,
                sizeUsd: sizeUsd
            })
        );
        emit TradeExecuted(vault, trader, market, isLong, collateral, leverageBps, sizeUsd);
    }

    function recordClose(address vault, bytes32 market, int256 pnl, uint256 lossBps) external onlyOwner {
        address trader = vaultTrader[vault];
        require(trader != address(0), "UNKNOWN_VAULT");
        if (pnl < 0 && lossBps >= lossCooldownThresholdBps) {
            lastLargeLossAt[vault] = block.timestamp;
        }
        adapter.closePosition(vault, trader, market, pnl);
        emit TradeClosed(vault, trader, market, pnl, lossBps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _vaultAssets(address vault) internal view returns (uint256 assets) {
        (bool ok, bytes memory data) = vault.staticcall(abi.encodeWithSignature("totalAssets()"));
        require(ok && data.length >= 32, "ASSET_READ");
        assets = abi.decode(data, (uint256));
    }
}
