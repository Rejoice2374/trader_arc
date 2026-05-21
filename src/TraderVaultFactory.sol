// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {TraderController} from "./TraderController.sol";
import {TraderVault} from "./TraderVault.sol";

contract TraderVaultFactory {
    IERC20 public immutable asset;
    TraderController public immutable controller;

    mapping(address => address[]) public traderVaults;
    address[] public allVaults;

    event TraderVaultCreated(address indexed trader, address indexed vault, string name, string symbol);

    constructor(IERC20 asset_, TraderController controller_) {
        require(address(asset_) != address(0), "ZERO_ASSET");
        require(address(controller_) != address(0), "ZERO_CONTROLLER");
        asset = asset_;
        controller = controller_;
    }

    function createVault(string calldata name, string calldata symbol) external returns (address vault) {
        require(controller.approvedTraders(msg.sender), "TRADER_NOT_APPROVED");
        vault = address(new TraderVault(asset, msg.sender, address(controller), name, symbol));

        traderVaults[msg.sender].push(vault);
        allVaults.push(vault);

        controller.registerVault(vault, msg.sender);
        emit TraderVaultCreated(msg.sender, vault, name, symbol);
    }

    function allVaultsLength() external view returns (uint256) {
        return allVaults.length;
    }

    function traderVaultsLength(address trader) external view returns (uint256) {
        return traderVaults[trader].length;
    }
}
