# Swap Architecture

## Overview

TradeOS now uses a swap-based trading system where:
- Users receive **USDC** as airdrop
- Users trade **TestToken** via a **Swap contract**
- The swap price is controlled by the **simulation**

## Flow

1. **User starts session** → Backend airdrops USDC to smart account
2. **User clicks "Buy"** → Frontend executes swap: USDC → TestToken (at simulation price)
3. **User clicks "Sell"** → Frontend executes swap: TestToken → USDC (at simulation price)
4. **Price updates** → Backend automatically updates swap contract price

## Contracts

### Swap.sol
- Allows swapping USDC ↔ TestToken
- Price is set by backend (owner)
- Price represents: `1 USDC = X TestToken` (where X is simulation price)

### TestToken.sol
- ERC20 token that users trade
- 18 decimals
- Mintable by owner

## Backend Changes

✅ **Completed:**
- Swap contract created
- Airdrop now uses USDC
- Price update mechanism (throttled)
- Token balance checks for USDC
- Swap service with quote functions

## Frontend Changes Needed

⚠️ **Still Required:**

### 1. Swap Execution (Client-Side)

The actual swap transactions must be executed by the user's smart account (client-side), not the backend. This requires:

```typescript
// Frontend needs to:
// 1. Get swap contract address from backend/config
// 2. Approve USDC spending (if buying) or TestToken spending (if selling)
// 3. Execute swap transaction using smart account signer
// 4. Handle transaction confirmation
```

### 2. Smart Account Integration

The frontend needs to use the smart account's signer to:
- Approve token spending
- Execute swap transactions
- Handle transaction receipts

### 3. UI Updates

- Show USDC balance (instead of generic "tokens")
- Show TestToken balance (after buying)
- Display swap quotes before executing
- Show transaction status

## Example Frontend Code

```typescript
// Approve USDC for swap
const approveTx = await smartAccount.sendTransaction({
  to: USDC_ADDRESS,
  data: encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [SWAP_CONTRACT_ADDRESS, usdcAmount]
  })
});

// Execute buy swap
const swapTx = await smartAccount.sendTransaction({
  to: SWAP_CONTRACT_ADDRESS,
  data: encodeFunctionData({
    abi: SWAP_ABI,
    functionName: 'buy',
    args: [usdcAmount]
  })
});
```

## Environment Variables

Backend `.env`:
```env
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
TEST_TOKEN_ADDRESS=0x... # Your deployed TestToken
SWAP_CONTRACT_ADDRESS=0x... # Your deployed Swap contract
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_SWAP_CONTRACT_ADDRESS=0x... # Your deployed Swap contract
NEXT_PUBLIC_TEST_TOKEN_ADDRESS=0x... # Your deployed TestToken
NEXT_PUBLIC_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Price Updates

The backend automatically updates the swap contract price:
- Every 10 seconds (throttled)
- Or when price changes by >1%
- Uses `updateSwapPrice()` function

## Current Limitations

1. **Swap execution is not yet implemented in frontend** - needs client-side transaction signing
2. **Token approvals** - users need to approve before swapping (one-time per token)
3. **Gas costs** - users pay gas for swap transactions (can be mitigated with gasless transactions via ERC-4337)

## Next Steps

1. Deploy contracts (see `apps/backend/contracts/DEPLOYMENT.md`)
2. Update frontend to execute swaps client-side
3. Add approval UI/flow
4. Test end-to-end flow

