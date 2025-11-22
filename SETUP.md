# Smart Account & Airdrop Setup

This project uses ERC-4337 smart accounts and airdrops test tokens when users start a trading session.

## Environment Variables

### Backend (`apps/backend/.env`)

```bash
# Alchemy RPC URL (required for smart accounts)
# Get your API key from https://dashboard.alchemy.com/
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Or use a generic RPC URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key for airdropping tokens (must have Sepolia ETH)
# This should be a funded account on Sepolia testnet
PRIVATE_KEY=0x...

# Optional: Deployed test token address (if you deploy your own ERC20 token)
# If not set, the system will airdrop native ETH instead
TEST_TOKEN_ADDRESS=0x...
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

### 1. Get Alchemy API Key

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

