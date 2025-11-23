# 🚀 Deploy Contracts Now

## Quick Steps

### 1. Create `.env` file

```bash
cd apps/backend/contracts
cat > .env << EOF
PRIVATE_KEY=0xYourPrivateKeyHere
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_key
EOF
```

**Important:** Replace with your actual values!

### 2. Deploy using the script

```bash
./deploy.sh
```

This will:
- Deploy TestToken
- Deploy Swap contract
- Mint TestToken to swap contract
- Verify contracts on Etherscan

### 3. Add USDC liquidity

After deployment, transfer USDC to the swap contract:

```bash
# Replace SWAP_CONTRACT_ADDRESS with the address from deployment
cast send 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 \
  "transfer(address,uint256)" \
  SWAP_CONTRACT_ADDRESS \
  1000000000000 \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

### 4. Update backend `.env`

Add to `apps/backend/.env`:

```env
TEST_TOKEN_ADDRESS=0x... # From deployment output
SWAP_CONTRACT_ADDRESS=0x... # From deployment output
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Manual Deployment (Alternative)

If the script doesn't work, deploy manually:

```bash
# 1. Deploy TestToken
forge create TestToken \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY

# 2. Save TestToken address, then deploy Swap
forge create Swap \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY \
  --constructor-args 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 TEST_TOKEN_ADDRESS 1000000000000000000

# 3. Mint TestToken to swap
cast send TEST_TOKEN_ADDRESS \
  "mint(address,uint256)" \
  SWAP_CONTRACT_ADDRESS \
  1000000000000000000000000 \
  --rpc-url sepolia \
  --private-key $PRIVATE_KEY
```

## What You Need

1. ✅ **Foundry installed** (you have it!)
2. ✅ **Contracts compiled** (done!)
3. ⚠️ **Sepolia ETH** for gas
4. ⚠️ **Alchemy API key** for RPC
5. ⚠️ **USDC on Sepolia** for liquidity

## Get Test USDC

You can get test USDC from:
- Sepolia faucets that support USDC
- Or if you have minter permissions on the USDC contract

The USDC address on Sepolia is: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

## Ready to Deploy?

Run: `./deploy.sh`

