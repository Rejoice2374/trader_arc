// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RiskManager {
    address public owner;
    mapping(address => bool) public pausedVaults;

    event VaultPaused(address indexed vault, string reason);
    event VaultUnpaused(address indexed vault);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "ZERO_OWNER");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function pauseVault(address vault, string calldata reason) external onlyOwner {
        pausedVaults[vault] = true;
        emit VaultPaused(vault, reason);
    }

    function unpauseVault(address vault) external onlyOwner {
        pausedVaults[vault] = false;
        emit VaultUnpaused(vault);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
