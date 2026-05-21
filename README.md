# TradeArc

TradeArc is a copy-trading vault system for Arc Testnet. Users deposit USDC into trader-managed vaults, traders request trades through guarded controller rules, and the backend indexes contract events for portfolio and marketplace views.

## Repository Layout

- `src/` - Foundry smart contracts for vaults, trader permissions, risk controls, and the Synthra adapter boundary.
- `test/` - Foundry tests for deposits, withdrawals, trade limits, pause, and cooldown behavior.
- `Backend/` - Express API, MySQL/Aiven schema, and ethers event listener scaffold.
- `Frontend/` - Vite React app with Privy authentication and the core TradeArc screens.

## Smart Contracts

```shell
forge build
forge test
```

Deployment expects these environment variables:

```shell
USDC_ADDRESS=0x...
ARC_RPC_URL=https://rpc.testnet.arc.network
```

```shell
forge script script/DeployTradeArc.s.sol:DeployTradeArc --rpc-url "$ARC_RPC_URL" --broadcast
```

The deployment creates the shared `RiskManager`, `SynthraAdapter`, `TraderController`, and `TraderVaultFactory`.
After a trader application is approved, approve the trader on-chain through `TraderController.setTraderApproval(trader, true)`.
The approved trader can then call `TraderVaultFactory.createVault(name, symbol)` from their connected wallet.

## Backend

```shell
cd Backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Primary endpoints:

- `GET /traders`
- `GET /traders/:id`
- `POST /traders/applications`
- `GET /vaults`
- `GET /vaults/:id`
- `GET /user/:wallet/portfolio`

The indexer is started separately:

```shell
npm run indexer
```

## Frontend

```shell
cd Frontend
cp .env.example .env
npm install
npm run dev
```

Set `VITE_PRIVY_APP_ID` to your Privy app ID and `VITE_API_URL` to the backend URL.

## Security Note

Do not commit live database passwords, API keys, or Privy IDs. If secrets were pasted into local markdown or shared files, rotate them before deploying.
