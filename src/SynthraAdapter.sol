// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SynthraAdapter {
    address public owner;

    struct PositionRequest {
        address vault;
        address trader;
        bytes32 market;
        bool isLong;
        uint256 collateral;
        uint256 leverageBps;
        uint256 sizeUsd;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event PositionOpened(
        address indexed vault,
        address indexed trader,
        bytes32 indexed market,
        bool isLong,
        uint256 collateral,
        uint256 leverageBps,
        uint256 sizeUsd
    );
    event PositionClosed(address indexed vault, address indexed trader, bytes32 indexed market, int256 pnl);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "ZERO_OWNER");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function openPosition(PositionRequest calldata request) external onlyOwner {
        emit PositionOpened(
            request.vault,
            request.trader,
            request.market,
            request.isLong,
            request.collateral,
            request.leverageBps,
            request.sizeUsd
        );
    }

    function closePosition(address vault, address trader, bytes32 market, int256 pnl) external onlyOwner {
        emit PositionClosed(vault, trader, market, pnl);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_OWNER");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
