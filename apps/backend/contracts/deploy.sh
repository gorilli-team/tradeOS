#!/bin/bash

# TradeOS Smart Contracts Deployment Script
# Deploys TestToken and Swap contracts to Sepolia testnet

set -e

echo "🚀 TradeOS Smart Contracts Deployment"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with:"
    echo "  PRIVATE_KEY=your_private_key"
    echo "  SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
    echo "  ETHERSCAN_API_KEY=your_etherscan_key (optional)"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "❌ Error: SEPOLIA_RPC_URL not set in .env"
    exit 1
fi

# Check if forge is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Error: Foundry (forge) is not installed"
    echo "Install it with: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
fi

echo "✅ Foundry installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
forge install OpenZeppelin/openzeppelin-contracts --no-commit
echo "✅ Dependencies installed"
echo ""

# Build contracts
echo "🔨 Building contracts..."
forge build
echo "✅ Contracts built"
echo ""

# Deploy contracts
echo "🚀 Deploying to Sepolia..."
echo ""

forge script script/Deploy.s.sol:DeployScript \
    --rpc-url sepolia \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Transfer USDC to the swap contract for liquidity"
echo "2. Update apps/backend/.env with:"
echo "   TEST_TOKEN_ADDRESS=<deployed_address>"
echo "   SWAP_CONTRACT_ADDRESS=<deployed_address>"
echo "   USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"

