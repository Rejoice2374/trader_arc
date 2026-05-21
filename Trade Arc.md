# TradeArc

##### Copy trading vault system on Arc Testnet (https://docs.arc.io/)



## Mode of operation

#### **For Users**

* Users deposit USDC
* Funds go into a vault (smart contract)
* A trader controls the strategy
* Trades execute on synthra (https://docs.synthra.org/integration \& )
* Profits/Losses are shared

#### **For Traders**

* Connects wallet like regular users
* Click "Become a trader" button
* Sumbits: Wallet address, Trading experience, strategy description and past performance. They are stored initially to database with status pending till approval or rejection.
* They deposit funds to be added to their vaults on approval.







## ARCHITECTURE



##### Smart contract architecture (Solidity)

**1. Vault contract (ERC-4626):** each trader gets their own vault.

* Reponsibilities of trader vault: accept deposit USDC, mint shares, track user balances, handle withdrawals, store total assets.

basically users don't own trades, they own shares of the vault



**2. Trader controller contract: this controls trading permissions.**

* Only approved trader wallet can execute trades.
* Security rules: max leverage (e.g 5x), max % of Vault per trade (e.g 20%), cooldown between trades (e.g, 1 day cool down if previous trade closes with a lose of 20% and above).



**3. PerpDex Adapter Contract: this integrates Synthra** **contracts**



**4. Risk Manager Module: Monitors drawdown and can pause trading**



**Smart contract structure**

* Vault.sol
* TraderController.sol
* GMXAdapter.sol
* RiskManager.sol



##### Backend Architecture (using Node, express and Aiven for the backend)

**First-of setup cloud database with Aiven**

Create core Tables

1. Users table
2. Traders table
3. Vaults table
4. Trades table
5. Deposits table



**Then build the blockchain indexer (Listening layer)**

The backend listens to events emitted from the smart contracts: track deposits, track trades, track pnl using RPC providers (Alchemy)

Using Alchemy, the backend can:



1. Read data
* Wallet balances
* Contract state
* Open positions

2\. Listen to events

* Deposits
* Trades
* Withdrawals

3\. Send transactions

* Execute trades (if needed)
* Interact with contracts



\##Connect using ethers.js

&#x09;*import { ethers } from "ethers";*



&#x09;*const provider = new ethers.JsonRpcProvider(*

&#x09;  *"https://arc-testnet.g.alchemy.com/v2/ALCHEMY\_API\_KEY"*

&#x09;*);*



\##Example: Reading Data

&#x09;*const balance = await provider.getBalance("0xUserAddress");*



&#x09;##Example: Listening to Events

&#x09;*const contract = new ethers.Contract(address, abi, provider);*



&#x09;*contract.on("Deposit", (user, amount) => {*

&#x09;  *console.log("Deposit:", user, amount);*

&#x09;*});*



So this way the backend stores users, deposits, withdrawals, trades and vault balances

Then with these backend computes: ROI, win\_rate, drawdown, pnls



Now backend monitors risk; it continuously checks Opened position on perpDex, Vault exposure, Market Prices

Send alerts through email



**Major Endpoints**

GET /traders

GET /vaults

Get /vaults/:id

Get /user/:wallet/portfolio

Get /traders/:id



##### FRONTEND ARCHITECTURE (WHAT USERS SEE)

🔹 Tech Stack

* Vite and Shadcn
* Privy (users can connect with email, socials and wallet. if they connect with email or socials privy automatically creates a wallet for them)

npm install @privy-io/react-auth@latest

import the **PrivyProvider** component and wrap your app with it as shown below

&#x09;

*'use client'*



*import { PrivyProvider } from '@privy-io/react-auth'*

*import { arcTestnet } from 'viem/chains'*



*export default function Providers({*

&#x20; *children,*

*}: {*

&#x20; *children: React.ReactNode*

*}) {*

&#x20; *return (*

&#x20;   *<PrivyProvider*

&#x20;     *appId="privy-app-id"*

&#x20;     *config={{*

&#x20;       *loginMethods: \['email', 'wallet'],*



&#x20;       *embeddedWallets: {*

&#x20;         *ethereum: {*

&#x20;           *createOnLogin: 'users-without-wallets',*

&#x20;         *},*

&#x20;       *},*



&#x20;       *defaultChain: arcTestnet,*

&#x20;     *}}*

&#x20;   *>*

&#x20;     *{children}*

&#x20;   *</PrivyProvider>*

&#x20; *)*

*}*



It’s important to wait until the PrivyProvider has finished initializing before you consume Privy’s state and interfaces, to ensure that the state you consume is accurate and not stale.

To determine whether the Privy SDK has fully initialized on your page, check the ready Boolean returned by the usePrivy hook. When ready is true, Privy has completed initialization, and your app can consume Privy’s state and interfaces.

import {usePrivy} from '@privy-io/react-auth';



function YourComponent() {

&#x20; const {ready} = usePrivy();



&#x20; if (!ready) {

&#x20;   return <div>Loading...</div>;

&#x20; }



&#x20; // Now it's safe to use other Privy hooks and state

&#x20; return <div>Privy is ready!</div>;

}



* Ethers.js/viem



1. Core Pages

🏠User/Trader Dashboard

* Total balance
* PnL
* Active vaults 



📊 Trader Marketplace

* List of traders
* Traders Stats: ROI, risk score, drawdown



📈 Vault Page

* Deposit / withdraw
* Trade history
* Performance chart



⚙️ Trader Panel (for traders only)

* Open/close trades
* View vault balance
* Risk limits





##### Environment Variables

* **smart contract .env variables**

ARC\_RPC\_URL=https://rpc.testnet.arc.network

ARC\_CHAIN\_ID=5042002



* **backend .env variables**

//This is my Aiven Database Connection

DB\_HOST = mysql-3ac12977-traderarc1.e.aivencloud.com

DB\_USERNAME = avnadmin

DB\_PASSWORD = AVNS\_PII4mqKqt0PMLeR5XYb

DB\_NAME = TraderArc



//This is my alchemy api key

*ALCHEMY\_API\_KEY = qAFm91acZWuj0bF0Vstrn*



* **frontend .env variables**

//This is my privy app ID

privy-app-id=cmimemqzx01loik0cz5nwqx3t



















&#x20;

