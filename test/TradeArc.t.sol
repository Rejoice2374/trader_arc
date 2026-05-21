// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {RiskManager} from "../src/RiskManager.sol";
import {SynthraAdapter} from "../src/SynthraAdapter.sol";
import {TraderController} from "../src/TraderController.sol";
import {TraderVault} from "../src/TraderVault.sol";
import {TraderVaultFactory} from "../src/TraderVaultFactory.sol";

contract TradeArcTest is Test {
    MockUSDC private usdc;
    RiskManager private risk;
    SynthraAdapter private adapter;
    TraderController private controller;
    TraderVaultFactory private factory;
    TraderVault private vault;

    address private owner = address(this);
    address private trader = address(0xA11CE);
    address private user = address(0xB0B);
    bytes32 constant ETH_USD = "ETH-USD";

    function setUp() public {
        usdc = new MockUSDC();
        risk = new RiskManager(owner);
        adapter = new SynthraAdapter(owner);
        controller = new TraderController(risk, adapter, owner);
        factory = new TraderVaultFactory(IERC20(address(usdc)), controller);
        adapter.transferOwnership(address(controller));
        controller.setVaultFactory(address(factory));
        controller.setTraderApproval(trader, true);

        vm.prank(trader);
        vault = TraderVault(factory.createVault("TradeArc BTC Vault", "taBTC"));

        usdc.mint(user, 10_000e6);
        vm.prank(user);
        usdc.approve(address(vault), type(uint256).max);
    }

    function testDepositMintsVaultShares() public {
        vm.prank(user);
        uint256 shares = vault.deposit(1_000e6, user);

        assertEq(vault.totalAssets(), 1_000e6);
        assertEq(vault.balanceOf(user), shares);
        assertEq(shares, 1_000e18);
    }

    function testWithdrawRedeemsUserAssets() public {
        vm.startPrank(user);
        vault.deposit(1_000e6, user);
        uint256 sharesBurned = vault.withdraw(250e6, user, user);
        vm.stopPrank();

        assertEq(sharesBurned, 250e18);
        assertEq(vault.totalAssets(), 750e6);
        assertEq(usdc.balanceOf(user), 9_250e6);
    }

    function testApprovedTraderCanRequestTradeWithinLimits() public {
        vm.prank(user);
        vault.deposit(1_000e6, user);

        vm.expectEmit(true, true, true, true);
        emit TraderController.TradeExecuted(address(vault), trader, ETH_USD, true, 100e6, 30_000, 300e6);

        vm.prank(trader);
        vault.requestTrade(100e6, 30_000, ETH_USD, true);
    }

    function testTradeRevertsWhenExposureIsTooHigh() public {
        vm.prank(user);
        vault.deposit(1_000e6, user);

        vm.prank(trader);
        vm.expectRevert("EXPOSURE_LIMIT");
        vault.requestTrade(250e6, 30_000, ETH_USD, true);
    }

    function testRiskPauseBlocksTrading() public {
        vm.prank(user);
        vault.deposit(1_000e6, user);

        risk.pauseVault(address(vault), "manual review");

        vm.prank(trader);
        vm.expectRevert("VAULT_PAUSED");
        vault.requestTrade(100e6, 30_000, ETH_USD, true);
    }

    function testLargeLossStartsCooldown() public {
        vm.prank(user);
        vault.deposit(1_000e6, user);

        controller.recordClose(address(vault),ETH_USD, -200e6, 2_000);

        vm.prank(trader);
        vm.expectRevert("COOLDOWN");
        vault.requestTrade(100e6, 30_000,ETH_USD, true);
    }

    function testFactoryRejectsUnapprovedTrader() public {
        address unapprovedTrader = address(0xBAD);

        vm.prank(unapprovedTrader);
        vm.expectRevert("TRADER_NOT_APPROVED");
        factory.createVault("TradeArc SOL Vault", "taSOL");
    }

    function testOnlyTrustedFactoryCanRegisterVaultForApprovedTrader() public {
        TraderVault rogueVault =
            new TraderVault(IERC20(address(usdc)), trader, address(controller), "Rogue Vault", "rVAULT");

        vm.prank(address(0xFACADE));
        vm.expectRevert("NOT_OWNER_OR_FACTORY");
        controller.registerVault(address(rogueVault), trader);
    }

    function testOwnerCannotRegisterVaultForUnapprovedTrader() public {
        address unapprovedTrader = address(0xBAD);
        TraderVault newVault =
            new TraderVault(IERC20(address(usdc)), unapprovedTrader, address(controller), "New Vault", "nVAULT");

        vm.expectRevert("TRADER_NOT_APPROVED");
        controller.registerVault(address(newVault), unapprovedTrader);
    }
}
