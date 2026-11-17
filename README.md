# ChainTrace – Blockchain-Based Supply Chain Tracking & Traceability System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Ethereum%20Sepolia-627EEA?logo=ethereum)](https://sepolia.etherscan.io/)
[![Hardhat](https://img.shields.io/badge/Hardhat-EVM-yellow?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Storage-MongoDB%20Atlas%20%7C%20Local%20JSON-47A248?logo=mongodb)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ChainTrace** is a production-grade, decentralized supply chain provenance and verification system built for B.Tech Capstone engineering evaluation and enterprise auditing. It establishes end-to-end transparency across physical supply chain lifecycles from manufacturer provenance to consumer delivery by anchoring cryptographic Keccak-256 batch fingerprints and immutable custody handoffs directly onto the Ethereum blockchain.

Developed by **[Saiteja-1605](https://github.com/Saiteja-1605)**.

---

## 🌟 Key Features

- **Decentralized Provenance**: Every registered product batch generates a deterministic Keccak-256 hash permanently committed to the Ethereum blockchain (`SupplyChain.sol`).
- **Cryptographic Anti-Counterfeiting**: Public verification recalculates the hash on-the-fly and compares it against on-chain state to detect even a single altered metadata byte (e.g. counterfeit expiry or falsified batch).
- **Dual Blockchain Architecture**:
  - **Local Development**: Runs out-of-the-box on a local Hardhat EVM (`chainId: 31337`) with zero gas costs.
  - **Public Testnet**: Fully configured for Ethereum Sepolia (`chainId: 11155111`) with automated contract deployment and Etherscan transaction explorer links.
- **Dual Persistence Architecture**:
  - **Local Offline Mode**: Zero-dependency atomic JSON datastores (`backend/data/*.json`).
  - **Cloud Mode**: Seamless automatic hot-switching to **MongoDB Atlas** when `MONGODB_URI` is provided, retaining full ACID persistence and collection telemetry.
- **Role-Based Access Control (RBAC)**: Secure bcrypt-hashed authentication with 4 specialized roles:
  - 🏭 **Manufacturer**: Product registration, Keccak-256 hashing, batch dispatching, QR label printing.
  - 🚚 **Distributor**: Warehouse intake, transit dispatching, custody transfer.
  - 🏪 **Retailer**: Store inventory receipt, shelf stock management, final consumer delivery mark.
  - 🛡️ **Admin**: System-wide oversight, participant management, tamper audit logs, blockchain transaction explorer.
- **Dynamic QR Code Engine**:
  - Instant high-resolution QR label generation with printable A4/thermal sticker layouts.
  - Universal QR Scanner (`html5-qrcode`): Live camera scanning, image upload decoding, and instant demo selector buttons.
- **Public Consumer Portal**:
  - `/verify` and `/track/:id` allow consumers to verify genuine origin and inspect the full custody timeline without requiring an account or MetaMask.

---

## 🏛 System Architecture

```
ChainTrace/
├── blockchain/                # Solidity Smart Contracts & Hardhat Engine
│   ├── contracts/
│   │   └── SupplyChain.sol    # Smart Contract (Solidity 0.8.20, viaIR enabled)
│   ├── scripts/
│   │   ├── deploy.js          # Deployment & contract ABI auto-exporter
│   │   └── deploy-sepolia.js  # Dedicated Sepolia testnet deployment script
│   ├── test/
│   │   └── SupplyChain.test.js# Hardhat unit tests (100% passing)
│   └── hardhat.config.js      # Dual-network EVM configuration (Localhost + Sepolia)
│
├── backend/                   # Node.js + Express REST API Relayer
│   ├── src/
│   │   ├── config/            # Exported contract ABI and network addresses
│   │   ├── middleware/        # JWT verification & role authorization
│   │   ├── models/            # Mongoose schemas (User, Product, Transaction, AuditLog)
│   │   ├── routes/            # Auth, Products, Tracking, Blockchain, Analytics
│   │   ├── services/
│   │   │   ├── blockchainService.js # Ethers.js multi-network provider & retry relayer
│   │   │   └── storageService.js    # Dual storage driver (MongoDB Atlas & Local JSON)
│   │   └── server.js          # Express server with /api/health telemetry
│   └── data/                  # Persistent local JSON fallback datastores
│
├── frontend/                  # React 18 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, Timeline, Modals, StatusBadges
│   │   ├── context/           # AuthContext (JWT session state)
│   │   ├── pages/             # Admin, Manufacturer, Distributor, Retailer, Track, Verify
│   │   └── services/          # Unified Axios/Fetch API client
│   ├── index.html
│   └── tailwind.config.js     # Enterprise Navy, Blue & Slate color palette
│
├── start-all.js               # One-click Windows/Linux master orchestrator
└── package.json               # Monorepo orchestration scripts
```

---

## 🔄 Supply Chain Lifecycle State Machine

```
[1. Registered]   ───►   [2. Manufactured]   ───►   [3. Dispatched]
  (Manufacturer)           (Factory QA Line)          (Outbound Logistics)
                                                            │
                                                            ▼
[6. Delivered]    ◄───   [5. Received]       ◄───   [4. In Transit]
  (End Consumer)           (Retail Store)             (Freight Hub)
```

1. **Registered**: Product metadata is submitted. Deterministic Keccak-256 fingerprint is recorded on-chain.
2. **Manufactured**: Production quality inspection complete. Status updated with factory remarks.
3. **Dispatched**: Outbound logistics manifest generated; custody handed to logistics partner.
4. **In Transit**: Distributor scans QR label at cargo hub, accepting verifiable custody on-chain.
5. **Received**: Retailer verifies cryptographic hash against smart contract before accepting shelf delivery.
6. **Delivered**: Retailer records fulfillment to the end customer.

---

## 👥 Demo Credentials

For quick evaluation, pre-seeded accounts are available with 1-click auto-fill on the login screen:

| Role | Email | Password | Hardhat Signer Address |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@chaintrace.local` | `password123` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Account #0) |
| **Manufacturer** | `manufacturer@chaintrace.local` | `password123` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account #1) |
| **Distributor** | `distributor@chaintrace.local` | `password123` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Account #2) |
| **Retailer** | `retailer@chaintrace.local` | `password123` | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` (Account #3) |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js >= 18.x (Tested on Node v20 & v24)
- npm >= 9.x
- Git

### One-Command Quickstart
```bash
# Clone the repository
git clone https://github.com/Saiteja-1605/ChainTrace.git
cd ChainTrace

# Launch local blockchain, contract deployment, backend, and frontend
npm run dev
```

The master script automatically boots:
- Local Hardhat node at `http://127.0.0.1:8545`
- Compiles and deploys `SupplyChain.sol`
- Express REST API at `http://localhost:5000`
- React Vite frontend at `http://localhost:3000`

---

## ☁️ Cloud Deployment Architecture

### 1. Database — MongoDB Atlas
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create database user and whitelist IP `0.0.0.0/0` (Allow Access from Anywhere).
3. Copy connection string:
   ```
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chaintrace?retryWrites=true&w=majority"
   ```
4. Place in `backend/.env`. ChainTrace automatically initializes collections (`users`, `products`, `transactions`, `auditLogs`) on startup.

### 2. Smart Contract — Ethereum Sepolia Testnet
1. Get a Sepolia RPC endpoint from Alchemy / Infura / QuickNode.
2. Fund an Ethereum Sepolia wallet using a faucet (e.g., [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)).
3. Configure `blockchain/.env`:
   ```bash
   SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
   SEPOLIA_PRIVATE_KEY="your_wallet_private_key_without_0x"
   ```
4. Deploy to Sepolia:
   ```bash
   cd blockchain
   npm run deploy:sepolia
   ```
5. The deployed contract address and ABI are automatically synchronized into `backend/src/config/contractInfo.json` and `frontend/src/contracts/contractInfo.json`.

### 3. Backend — Render Web Service
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && node src/server.js`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `JWT_SECRET=<strong_random_secret>`
  - `MONGODB_URI=<your_atlas_uri>`
  - `SEPOLIA_RPC_URL=<your_sepolia_rpc>`
  - `SEPOLIA_PRIVATE_KEY=<your_sepolia_private_key>`
  - `FRONTEND_URL=https://<your-frontend>.onrender.com`

### 4. Frontend — Render Static Site / Vercel
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Root Directory**: `frontend`
- **Environment Variables**:
  - `VITE_API_URL=https://<your-backend-service>.onrender.com`

---

## 🧪 Automated Testing

### Smart Contract Tests (Hardhat)
```bash
cd blockchain
npx hardhat test
```

### Full System End-to-End Test Suite
```bash
node test-all.js
```
Runs comprehensive validation across:
- Hardhat RPC connectivity and contract deployment verification
- Backend health endpoints and cryptographic verification routes
- Bcrypt demo login authentication and role-based permissions
- Keccak-256 product batch hash calculation and tamper detection
- Timeline event auditing and transaction logging

---

## 📜 License & Academic Citation

This project is developed as an academic engineering capstone project. Distributed under the MIT License.

**Author**: Saiteja ([@Saiteja-1605](https://github.com/Saiteja-1605))  
**Repository**: [https://github.com/Saiteja-1605/ChainTrace](https://github.com/Saiteja-1605/ChainTrace)
