# Quick Deployment Guide

## Prerequisites

1. **Foundry installed** ✅ (You have it!)
2. **Sepolia ETH** for gas fees
3. **Alchemy API key** (or other Sepolia RPC)

## Step 1: Setup Environment

```bash
cd apps/backend/contracts
cp .env.example .env
```

Edit `.env`:
```env
PRIVATE_KEY=0xYourPrivateKeyHere
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_key_here  # Optional
```

## Step 2: Install Dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

## Step 3: Deploy Contracts

### Option A: Use the deployment script (Recommended)

```bash
./deploy.sh
```

### Option B: Manual deployment

```bash
# Deploy TestToken
forge create TestToken \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY

# Save the TestToken address, then deploy Swap
# Replace TEST_TOKEN_ADDRESS with the address from above
forge create Swap \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 TEST_TOKEN_ADDRESS 1000000000000000000

# Mint TestToken to swap contract
cast send TEST_TOKEN_ADDRESS \
  "mint(address,uint256)" \
  SWAP_CONTRACT_ADDRESS \
  1000000000000000000000000 \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

## Step 4: Add USDC Liquidity

The swap contract needs USDC for users to buy TestToken. Transfer USDC to the swap contract:

```bash
# Transfer 1,000,000 USDC (6 decimals) to swap contract
cast send 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 \
  "transfer(address,uint256)" \
  SWAP_CONTRACT_ADDRESS \
  1000000000000 \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

**Note:** You need to have USDC in your deployer account first. You can:
- Get test USDC from a faucet
- Or mint it if you have minter permissions on the USDC contract

## Step 5: Update Backend Config

Add to `apps/backend/.env`:

```env
TEST_TOKEN_ADDRESS=0x... # From deployment
SWAP_CONTRACT_ADDRESS=0x... # From deployment
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Step 6: Fund Airdrop Account

Your airdrop account (the one with `PRIVATE_KEY` in backend `.env`) needs USDC to airdrop to users.

## Verification

Check contracts on Etherscan:
- TestToken: https://sepolia.etherscan.io/address/YOUR_ADDRESS
- Swap: https://sepolia.etherscan.io/address/YOUR_ADDRESS

## Troubleshooting

### "Insufficient funds"
- Make sure your deployer account has Sepolia ETH

### "Contract verification failed"
- Check your ETHERSCAN_API_KEY
- Or skip verification: remove `--verify` flag

### "Dependencies not found"
- Run: `forge install OpenZeppelin/openzeppelin-contracts --no-commit`

### "USDC transfer failed"
- Make sure you have USDC in your account
- Check the USDC address is correct: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

