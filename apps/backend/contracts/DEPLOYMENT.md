# Smart Contracts Deployment Guide

This guide explains how to deploy the TradeOS smart contracts on Sepolia testnet.

## Contracts Overview

1. **TestToken.sol**: ERC20 token that users will trade
2. **Swap.sol**: Swap contract for trading USDC <-> TestToken at simulation prices

## Prerequisites

1. **Foundry** installed (for deployment)
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Sepolia ETH** for gas fees
   - Get from [Sepolia Faucet](https://sepoliafaucet.com/)

3. **USDC on Sepolia**
   - Address: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
   - You can get test USDC from faucets or mint it if you have the minter role

## Step 1: Setup Environment

Create a `.env` file in `apps/backend/contracts/`:

```bash
cd apps/backend/contracts
cp .env.example .env  # Create if doesn't exist
```

Add to `.env`:
```env
PRIVATE_KEY=your_deployer_private_key
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Step 2: Install Dependencies

```bash
# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

## Step 3: Deploy TestToken

```bash
forge create TestToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "TradeOS Test Token" "TOS"
```

Save the deployed address as `TEST_TOKEN_ADDRESS`.

## Step 4: Deploy Swap Contract

```bash
# Set initial price (e.g., 1 USDC = 1 TestToken = 1e18)
INITIAL_PRICE=1000000000000000000

forge create Swap \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $USDC_ADDRESS $TEST_TOKEN_ADDRESS $INITIAL_PRICE
```

Save the deployed address as `SWAP_CONTRACT_ADDRESS`.

## Step 5: Setup Liquidity

The swap contract needs liquidity to function:

1. **Mint TestToken** to the swap contract:
   ```bash
   # Mint 1,000,000 TestToken to swap contract
   cast send $TEST_TOKEN_ADDRESS \
     "mint(address,uint256)" \
     $SWAP_CONTRACT_ADDRESS \
     1000000000000000000000000 \
     --rpc-url $RPC_URL \
     --private-key $PRIVATE_KEY
   ```

2. **Transfer USDC** to the swap contract:
   ```bash
   # Transfer 1,000,000 USDC to swap contract
   cast send $USDC_ADDRESS \
     "transfer(address,uint256)" \
     $SWAP_CONTRACT_ADDRESS \
     1000000000000 \
     --rpc-url $RPC_URL \
     --private-key $PRIVATE_KEY
   ```

## Step 6: Configure Backend

Add to `apps/backend/.env`:

```env
# Contract addresses
TEST_TOKEN_ADDRESS=0x... # Your deployed TestToken address
SWAP_CONTRACT_ADDRESS=0x... # Your deployed Swap address
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

# Make sure you have USDC to airdrop to users
# The airdrop account needs USDC balance
```

## Step 7: Fund Airdrop Account

Your airdrop account (the one with `PRIVATE_KEY`) needs USDC to airdrop to users:

```bash
# Get USDC from a faucet or transfer from another account
# Users will receive USDC, then use it to buy TestToken via the swap
```

## How It Works

1. **User starts session** → Backend airdrops USDC to their smart account
2. **User clicks "Buy"** → Frontend executes swap: USDC → TestToken
3. **User clicks "Sell"** → Frontend executes swap: TestToken → USDC
4. **Price updates** → Backend updates swap contract price based on simulation

## Price Updates

The swap contract price is automatically updated by the backend when the simulation price changes (throttled to every 10 seconds or 1% price change).

The price in the swap contract represents: **1 USDC = X TestToken** (where X is the simulation price).

## Testing

Test the swap contract:

```bash
# Get buy quote
cast call $SWAP_CONTRACT_ADDRESS \
  "getBuyQuote(uint256)" \
  1000000 \
  --rpc-url $RPC_URL

# Get sell quote  
cast call $SWAP_CONTRACT_ADDRESS \
  "getSellQuote(uint256)" \
  1000000000000000000 \
  --rpc-url $RPC_URL
```

## Troubleshooting

### "Insufficient USDC in contract"
- Add more USDC liquidity to the swap contract

### "Insufficient TestToken in contract"
- Mint more TestToken to the swap contract

### "Price must be greater than 0"
- Ensure the initial price is set correctly (should be > 0)

### Swap execution fails
- Check that the smart account has approved the swap contract to spend USDC/TestToken
- Approval needs to be done client-side (frontend) before executing swaps

