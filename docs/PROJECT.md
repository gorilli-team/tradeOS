# tradeOS - Project Description & Architecture

## 🎯 What is tradeOS?

**tradeOS** is a gamified, on-chain trading simulator that combines the excitement of cryptocurrency trading with game mechanics, physical hardware controllers, and AI agent competition. Users trade a test ERC-20 token (TestToken) using USDC on the Sepolia testnet, with prices controlled by a sophisticated simulation engine.

### Key Features

- 🎮 **Gamified Trading**: XP system, levels, leaderboards, and points
- 🔐 **Web3 Integration**: ERC-4337 smart accounts, Privy wallet connection, on-chain transactions
- 🤖 **AI Agent Competition**: Deploy your own AI trading bots to compete
- 📊 **Real-time Charts**: TradingView-style charts with technical indicators
- 🎨 **Physical Hardware**: Adafruit device integration with LED signals and button controls
- 💰 **On-Chain Trading**: Real USDC airdrops and swap-based trading on Sepolia
- 📈 **Advanced Analytics**: RSI, momentum, volatility, buy frequency, AI-generated signals

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  - Wallet Connection (Privy)                                 │
│  - Real-time Charts (TradingView)                             │
│  - Trading UI & Signals                                       │
│  - AI Agents Management                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API + WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend (Express.js)                       │
│  - Trading Engine                                             │
│  - Price Simulator                                             │
│  - Smart Account Management (ERC-4337)                        │
│  - MongoDB (Trades, Users, Leaderboard)                       │
│  - WebSocket Server                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  Blockchain  │ │   MongoDB   │ │  Adafruit  │
│  (Sepolia)   │ │  Database   │ │  Device    │
│              │ │             │ │            │
│ - USDC       │ │ - Trades    │ │ - LEDs     │
│ - TestToken  │ │ - Users     │ │ - Buttons  │
│ - Swap       │ │ - Agents    │ │            │
│ - Smart Acct │ │ - Stats     │ │            │
└──────────────┘ └─────────────┘ └────────────┘
```

---

## 🛠️ How It's Made

### Technology Stack

#### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, Tailwind CSS
- **Charts**: TradingView Lightweight Charts
- **Wallet**: Privy SDK (ERC-4337 compatible)
- **Language**: TypeScript (strict mode)

#### **Backend**
- **Runtime**: Node.js + Express.js
- **WebSocket**: Native WebSocket (ws library)
- **Database**: MongoDB (Mongoose)
- **Blockchain**: Viem, Alchemy SDK (ERC-4337)
- **Language**: TypeScript

#### **Smart Contracts**
- **Language**: Solidity 0.8.27
- **Framework**: Foundry
- **Contracts**: 
  - `TestToken.sol` - ERC20 token for trading
  - `Swap.sol` - USDC ↔ TestToken swap contract
- **Network**: Sepolia testnet

#### **Infrastructure**
- **Monorepo**: pnpm workspaces + Turborepo
- **Package Manager**: pnpm
- **Deployment**: Vercel (frontend), Railway/Render (backend)

---

## 📦 Project Structure

```
tradeOS/
├── apps/
│   ├── frontend/              # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router pages
│   │   │   │   ├── page.tsx   # Main trading page
│   │   │   │   ├── agents/    # AI agents management
│   │   │   │   └── privy-provider.tsx
│   │   │   ├── components/    # React components
│   │   │   │   ├── Header.tsx
│   │   │   │   └── TradingViewChart.tsx
│   │   │   └── utils/         # Frontend utilities
│   │   └── package.json
│   │
│   ├── backend/               # Express.js backend server
│   │   ├── src/
│   │   │   ├── index.ts       # Main server file
│   │   │   ├── services/      # Business logic
│   │   │   │   ├── smartAccount.ts  # ERC-4337 accounts
│   │   │   │   ├── token.ts         # Token operations
│   │   │   │   ├── swap.ts          # Swap contract interaction
│   │   │   │   └── airdrop.ts       # Token airdrops
│   │   │   ├── models/        # MongoDB schemas
│   │   │   │   ├── User.ts
│   │   │   │   ├── Trade.ts
│   │   │   │   └── AIAgent.ts
│   │   │   ├── db/            # Database connection
│   │   │   └── utils/          # Backend utilities
│   │   ├── contracts/         # Smart contracts
│   │   │   ├── TestToken.sol
│   │   │   ├── Swap.sol
│   │   │   └── script/        # Deployment scripts
│   │   └── package.json
│   │
│   ├── ai-agent-example/      # Example AI trading agent
│   │   ├── server.py          # FastAPI server
│   │   └── requirements.txt
│   │
│   └── adafruit-device/       # Physical hardware integration
│       └── adafruit_device.py
│
├── packages/                   # Shared packages
│   ├── price-simulator/       # Price simulation engine
│   ├── trading-engine/        # Trading logic
│   ├── types/                 # Shared TypeScript types
│   └── utils/                 # Shared utilities
│
└── docs/                      # Documentation
    ├── PROJECT.md            # This file
    ├── VERCEL_DEPLOYMENT.md
    └── ...
```

---

## 🔄 How It Works

### 1. **User Flow**

```
User connects wallet (Privy)
    ↓
Backend creates ERC-4337 smart account
    ↓
Backend airdrops USDC to smart account
    ↓
User starts trading session
    ↓
Price simulator starts (real-time updates)
    ↓
User trades: USDC ↔ TestToken via Swap contract
    ↓
Trades saved to MongoDB
    ↓
Points calculated, leaderboard updated
```

### 2. **Trading Flow**

#### **Buy Trade**
1. User clicks "Buy" button
2. Frontend checks USDC balance
3. Frontend approves USDC spending (if needed)
4. Frontend executes swap: USDC → TestToken
5. Backend updates portfolio state
6. Backend calculates points
7. Trade saved to MongoDB
8. Leaderboard updated

#### **Sell Trade**
1. User clicks "Sell" button
2. Frontend checks TestToken balance
3. Frontend approves TestToken spending (if needed)
4. Frontend executes swap: TestToken → USDC
5. Backend updates portfolio state
6. Backend calculates points
7. Trade saved to MongoDB

### 3. **Price Simulation**

The price simulator generates realistic token price movements:

- **Patterns**: Pump, dump, rug pull, chop, whale spike, parabolic, slow grind
- **Trend Signals**: Up (green), Down (red), Sideways (yellow), Whale (purple), Rug (orange)
- **Difficulty-based**: Higher volatility in Pro mode
- **Real-time**: Updates every second via WebSocket

### 4. **Smart Account System**

- **ERC-4337**: Uses Alchemy's Light Account
- **Deterministic**: Same owner address = same smart account
- **On-chain**: All transactions are real on Sepolia
- **Airdrops**: USDC sent to smart account on session start

### 5. **Swap Contract**

- **Price Control**: Backend updates swap price based on simulation
- **Liquidity**: Contract holds USDC and TestToken reserves
- **Trading**: Users swap USDC ↔ TestToken at current simulation price
- **Automatic**: Price updates every 10 seconds or 1% change

---

## 🧩 Core Components

### **Frontend Components**

#### `TradingViewChart.tsx`
- Renders real-time price chart using TradingView Lightweight Charts
- Updates incrementally as new prices arrive
- Dark theme matching TradingView aesthetic

#### `Header.tsx`
- Wallet connection (Privy)
- User points and rank display
- Connection status
- Device signal indicators

#### `page.tsx` (Main Trading Page)
- Trading interface
- Buy/Sell buttons
- Portfolio display
- Trading signals panel
- Real-time price feed

### **Backend Services**

#### `smartAccount.ts`
- Creates/manages ERC-4337 smart accounts
- Uses Alchemy SDK
- Deterministic address generation

#### `token.ts`
- USDC balance checks
- TestToken balance checks
- Airdrop functionality

#### `swap.ts`
- Updates swap contract price
- Provides swap quotes
- Executes swaps (for backend operations)

#### `airdrop.ts`
- Orchestrates smart account creation
- Handles USDC airdrops
- Manages token distribution

### **Shared Packages**

#### `price-simulator`
- Fast price generation engine
- Multiple pattern support
- Trend signal generation
- Difficulty-based volatility

#### `trading-engine`
- Buy/sell logic
- Portfolio management
- PnL calculations
- Trade validation

#### `types`
- Shared TypeScript interfaces
- Type safety across monorepo
- Zod schemas for validation

---

## 🔐 Security & Architecture Decisions

### **Why ERC-4337 Smart Accounts?**

- **Better UX**: No need for users to hold ETH for gas
- **Account Abstraction**: Enhanced wallet features
- **On-chain Portfolio**: Real blockchain transactions
- **Future-proof**: Industry standard for Web3 apps

### **Why Privy?**

- **Multi-wallet Support**: Wallet, email, SMS login
- **ERC-4337 Compatible**: Works seamlessly with smart accounts
- **Easy Integration**: Simple React hooks
- **Production Ready**: Battle-tested infrastructure

### **Why MongoDB?**

- **Flexible Schema**: Easy to add new fields
- **Leaderboard Queries**: Efficient ranking queries
- **Trade History**: Store all trading activity
- **AI Agent Data**: Store agent metadata and stats

### **Why Swap Contract?**

- **On-chain Trading**: Real blockchain transactions
- **Price Control**: Backend controls swap price
- **Transparency**: All trades visible on-chain
- **Simulation Integration**: Price matches simulation

---

## 🚀 Deployment

### **Frontend (Vercel)**
- Automatic deployments from Git
- Environment variables in Vercel dashboard
- Custom domain support
- Preview deployments for PRs

### **Backend (Railway/Render)**
- Docker or Node.js deployment
- Environment variables for secrets
- MongoDB connection
- WebSocket support

### **Smart Contracts (Sepolia)**
- Deploy via Foundry
- Verify on Etherscan
- Fund with Sepolia ETH
- Add liquidity to swap contract

---

## 📊 Data Flow

### **Price Updates**
```
Price Simulator → Backend → WebSocket → Frontend → Chart
                                    ↓
                              Swap Contract (price update)
```

### **Trade Execution**
```
User Click → Frontend → Smart Account → Swap Contract → Blockchain
                ↓
         Backend API → MongoDB → Leaderboard
```

### **AI Agent Flow**
```
AI Agent → WebSocket (price feed) → Decision Logic → REST API (trade) → Backend → Blockchain
```

---

## 🎮 Game Mechanics

### **Difficulty Modes**

- **Noob**: Fixed $50 positions, safety limits
- **DeGen**: 10% of balance per trade
- **Pro**: Dynamic sizing, profit targets, stop losses

### **Points System**

- Points earned based on trade size and difficulty
- Pro mode: 2x multiplier
- DeGen mode: 1.5x multiplier
- Noob mode: 1x multiplier

### **Level System**

- XP gained from realized PnL
- Level = floor(sqrt(XP / 100)) + 1
- Level-up notifications via device signals

### **Leaderboard**

- Ranked by total points
- Includes both human traders and AI agents
- Real-time updates
- MongoDB-powered queries

---

## 🤖 AI Agent System

### **Architecture**

AI agents are **externally hosted services** that:

1. Register with tradeOS backend
2. Connect via WebSocket for price feeds
3. Fetch trading signals via REST API
4. Execute trades via REST API
5. Compete on leaderboard

### **Agent Requirements**

- Must be hosted on public URL
- Must manage own private key (client-side)
- Must implement trading strategy
- Must handle reconnection logic
- Must respect rate limits

### **Example Agent**

See `apps/ai-agent-example/` for a complete FastAPI-based agent implementation.

---

## 🔧 Development Workflow

### **Monorepo Benefits**

- **Shared Types**: Type safety across packages
- **Code Reuse**: Common utilities in packages
- **Parallel Development**: Work on multiple packages
- **Turborepo**: Fast builds with caching

### **Build Process**

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development
pnpm dev

# Run tests
pnpm test
```

### **Package Dependencies**

```
frontend → @tradeOS/types
backend → @tradeOS/types, @tradeOS/price-simulator, @tradeOS/trading-engine
price-simulator → (standalone)
trading-engine → (standalone)
```

---

## 📈 Technical Highlights

### **Real-time Updates**
- WebSocket for price feeds
- Incremental chart updates
- Live leaderboard
- Device signal broadcasting

### **On-chain Integration**
- ERC-4337 smart accounts
- Real USDC airdrops
- Swap-based trading
- Transaction history on Etherscan

### **Performance**
- Incremental chart updates (not full refresh)
- MongoDB indexing for fast queries
- Efficient price simulation
- Optimized WebSocket broadcasting

### **Scalability**
- Stateless backend (can scale horizontally)
- MongoDB for persistence
- WebSocket connection pooling
- AI agents run independently

---

## 🎯 Future Enhancements

Potential improvements:

- [ ] Gasless transactions (paymaster integration)
- [ ] Multi-token support
- [ ] Advanced trading strategies
- [ ] Social features (follow traders)
- [ ] Mobile app
- [ ] More AI agent strategies
- [ ] Tournament mode
- [ ] NFT rewards for achievements

---

## 📚 Documentation

- `docs/VERCEL_DEPLOYMENT.md` - Frontend deployment guide
- `docs/SWAP_ARCHITECTURE.md` - Swap system architecture
- `apps/backend/contracts/DEPLOYMENT.md` - Smart contract deployment
- `apps/ai-agent-example/README.md` - AI agent guide

---

## 🏆 What Makes tradeOS Unique?

1. **Gamified On-chain Trading**: Real blockchain transactions with game mechanics
2. **Physical Hardware Integration**: Adafruit device with LED signals
3. **AI Agent Competition**: Deploy bots to compete with humans
4. **ERC-4337 Smart Accounts**: Modern account abstraction
5. **Swap-based Trading**: On-chain swaps with simulation-controlled prices
6. **Real-time Analytics**: Advanced technical indicators and signals
7. **Leaderboard System**: Competitive ranking for traders and AI agents

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **Alchemy**: ERC-4337 infrastructure
- **Privy**: Wallet connection SDK
- **TradingView**: Charting library inspiration
- **OpenZeppelin**: Smart contract libraries
- **Foundry**: Solidity development framework

