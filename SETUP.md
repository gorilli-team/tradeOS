# Smart Account & Airdrop Setup

This project uses ERC-4337 smart accounts and airdrops test tokens when users start a trading session.

## Environment Variables

### Backend (`apps/backend/.env`)

Create a `.env` file in `apps/backend/` with the following:

```bash
# MongoDB Configuration
# Option 1: Local MongoDB (default)
MONGODB_URI=mongodb://localhost:27017/tradeOS

# Option 2: MongoDB Atlas (cloud - recommended)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tradeOS?retryWrites=true&w=majority

# Alchemy RPC URL (required for smart accounts)
# Get your API key from https://dashboard.alchemy.com/
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Or use a generic RPC URL
# RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key for airdropping tokens (must have Sepolia ETH)
# This should be a funded account on Sepolia testnet
PRIVATE_KEY=0x...

# Optional: Deployed test token address (if you deploy your own ERC20 token)
# If not set, the system will airdrop native ETH instead
# TEST_TOKEN_ADDRESS=0x...

# Server Configuration
PORT=3001
```

### Frontend (`apps/frontend/.env.local`)

```bash
# Privy App ID (required for wallet connection)
# Get your App ID from https://dashboard.privy.io/
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Setup Steps

### 1. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Add it to `.env` as `MONGODB_URI`

**Create `.env` file:**
```bash
cd apps/backend
cp .env.example .env  # If .env.example exists, or create manually
# Edit .env and add your MONGODB_URI
```

### 2. Get Alchemy API Key

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new app or use an existing one
3. Select "Sepolia" network
4. Copy your API key
5. Add it to `apps/backend/.env` as `ALCHEMY_RPC_URL`

### 2. Get Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app
3. Copy your App ID
4. Add it to `apps/frontend/.env.local` as `NEXT_PUBLIC_PRIVY_APP_ID`

### 3. Fund Your Airdrop Account

1. Get Sepolia ETH from a [faucet](https://sepoliafaucet.com/)
2. Create a private key for the airdrop account (or use an existing one)
3. Fund that account with Sepolia ETH
4. Add the private key to `apps/backend/.env` as `PRIVATE_KEY`

### 4. (Optional) Deploy Test Token

If you want to use a custom ERC20 token instead of native ETH:

1. Install Hardhat or use Remix
2. Deploy the `TestToken.sol` contract from `apps/backend/contracts/`
3. Add the deployed address to `apps/backend/.env` as `TEST_TOKEN_ADDRESS`

## How It Works

1. **User connects wallet** via Privy
2. **User clicks "Start Simulation"**
3. **Backend creates ERC-4337 smart account** for the user's wallet address
4. **Backend airdrops test tokens** (1000 tokens or ETH) to the smart account
5. **Smart account address is displayed** in the UI
6. **Transaction hash is shown** with a link to Sepolia Etherscan

## Smart Account Details

- Uses Alchemy's Light Account (ERC-4337)
- Deterministic address based on owner address
- Deployed on Sepolia testnet
- Can be viewed on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## Troubleshooting

### "RPC_URL not configured" error
- Make sure `ALCHEMY_RPC_URL` or `RPC_URL` is set in `apps/backend/.env`

### Airdrop fails
- Check that `PRIVATE_KEY` is set and the account has Sepolia ETH
- Verify the RPC URL is correct and accessible
- Check backend logs for detailed error messages

### Smart account creation fails
- Ensure Alchemy API key is valid
- Check that you're using Sepolia network
- Verify the account abstraction contracts are deployed on Sepolia

### MongoDB connection fails
- **Local MongoDB**: Make sure MongoDB is running
  ```bash
  # Check if running
  brew services list | grep mongodb
  
  # Start if not running
  brew services start mongodb-community
  ```
- **MongoDB Atlas**: Verify your connection string is correct
  - Check username/password are URL-encoded
  - Ensure your IP is whitelisted in Atlas
  - Verify network access is enabled
- **Environment variable**: Make sure `.env` file exists in `apps/backend/`
  - The file should be named exactly `.env` (not `.env.example`)
  - Restart the backend server after creating/editing `.env`
- **Connection string format**:
  - Local: `mongodb://localhost:27017/tradeOS`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/tradeOS?retryWrites=true&w=majority`
- **Note**: The app will continue to work without MongoDB, but trades won't be saved to the database

