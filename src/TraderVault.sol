// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

interface ITraderController {
    function assertCanTrade(address vault, address trader, uint256 collateral, uint256 leverageBps) external view;
    function recordTrade(
        address vault,
        address trader,
        uint256 collateral,
        uint256 leverageBps,
        bytes32 market,
        bool isLong
    ) external;
}

contract TraderVault {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    IERC20 public immutable assetToken;
    address public immutable trader;
    address public controller;
    address public owner;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Approval(address indexed owner, address indexed spender, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(
        address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares
    );
    event TradeRequested(
        address indexed trader,
        bytes32 indexed market,
        bool isLong,
        uint256 collateral,
        uint256 leverageBps,
        uint256 sizeUsd
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyTrader() {
        require(msg.sender == trader, "NOT_TRADER");
        _;
    }

    constructor(IERC20 asset_, address trader_, address controller_, string memory name_, string memory symbol_) {
        require(address(asset_) != address(0), "ZERO_ASSET");
        require(trader_ != address(0), "ZERO_TRADER");
        require(controller_ != address(0), "ZERO_CONTROLLER");
        assetToken = asset_;
        trader = trader_;
        controller = controller_;
        owner = msg.sender;
        name = name_;
        symbol = symbol_;
    }

    function asset() external view returns (address) {
        return address(assetToken);
    }

    function totalAssets() public view returns (uint256) {
        return assetToken.balanceOf(address(this));
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply;
        uint256 assetsBefore = totalAssets();
        if (supply == 0 || assetsBefore == 0) {
            return assets * 1e12;
        }
        return (assets * supply) / assetsBefore;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) {
            return shares / 1e12;
        }
        return (shares * totalAssets()) / supply;
    }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        require(assets > 0, "ZERO_ASSETS");
        require(receiver != address(0), "ZERO_RECEIVER");
        shares = convertToShares(assets);
        require(shares > 0, "ZERO_SHARES");
        require(assetToken.transferFrom(msg.sender, address(this), assets), "TRANSFER_FROM");
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function withdraw(uint256 assets, address receiver, address owner_) external returns (uint256 shares) {
        require(assets > 0, "ZERO_ASSETS");
        shares = convertToShares(assets);
        if (convertToAssets(shares) < assets) {
            shares += 1;
        }
        _spendAllowance(owner_, msg.sender, shares);
        _burn(owner_, shares);
        require(assetToken.transfer(receiver, assets), "TRANSFER");
        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address owner_) external returns (uint256 assets) {
        require(shares > 0, "ZERO_SHARES");
        assets = convertToAssets(shares);
        _spendAllowance(owner_, msg.sender, shares);
        _burn(owner_, shares);
        require(assetToken.transfer(receiver, assets), "TRANSFER");
        emit Withdraw(msg.sender, receiver, owner_, assets, shares);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function requestTrade(uint256 collateral, uint256 leverageBps, bytes32 market, bool isLong) external onlyTrader {
        ITraderController(controller).assertCanTrade(address(this), msg.sender, collateral, leverageBps);
        ITraderController(controller).recordTrade(address(this), msg.sender, collateral, leverageBps, market, isLong);
        emit TradeRequested(msg.sender, market, isLong, collateral, leverageBps, (collateral * leverageBps) / 10_000);
    }

    function setController(address newController) external onlyOwner {
        require(newController != address(0), "ZERO_CONTROLLER");
        controller = newController;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(balanceOf[from] >= amount, "SHARES");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "ZERO_TO");
        require(balanceOf[from] >= amount, "SHARES");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _spendAllowance(address owner_, address spender, uint256 amount) internal {
        if (owner_ == spender) {
            return;
        }
        uint256 allowed = allowance[owner_][spender];
        require(allowed >= amount, "ALLOWANCE");
        if (allowed != type(uint256).max) {
            allowance[owner_][spender] = allowed - amount;
        }
    }
}
