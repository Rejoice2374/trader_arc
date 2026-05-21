// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {RiskManager} from "../src/RiskManager.sol";
import {SynthraAdapter} from "../src/SynthraAdapter.sol";
import {TraderController} from "../src/TraderController.sol";
import {TraderVaultFactory} from "../src/TraderVaultFactory.sol";

contract DeployTradeArc is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast();

        RiskManager risk = new RiskManager(msg.sender);
        SynthraAdapter adapter = new SynthraAdapter(msg.sender);
        TraderController controller = new TraderController(risk, adapter, msg.sender);
        TraderVaultFactory factory = new TraderVaultFactory(IERC20(usdc), controller);

        adapter.transferOwnership(address(controller));
        controller.setVaultFactory(address(factory));

        vm.stopBroadcast();
    }
}
