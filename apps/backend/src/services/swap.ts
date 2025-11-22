import {
  createPublicClient,
  http,
  createWalletClient,
  formatUnits,
  parseUnits,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const RPC_URL =
  process.env.ALCHEMY_RPC_URL ||
  process.env.RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0x0000000000000000000000000000000000000000000000000000000000000001";

// USDC on Sepolia testnet
const USDC_ADDRESS = (process.env.USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238") as Address;

const SWAP_CONTRACT_ADDRESS = process.env.SWAP_CONTRACT_ADDRESS as
  | Address
  | undefined;

// Swap contract ABI
const SWAP_ABI = [
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "buy",
    outputs: [{ name: "testTokenAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "testTokenAmount", type: "uint256" }],
    name: "sell",
    outputs: [{ name: "usdcAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_newPrice", type: "uint256" }],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "price",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "getBuyQuote",
    outputs: [{ name: "testTokenAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "testTokenAmount", type: "uint256" }],
    name: "getSellQuote",
    outputs: [{ name: "usdcAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC20 ABI for approvals
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Update the swap contract price based on simulation price
 * @param price Simulation price (e.g., 1.5 means 1 USDC = 1.5 TestToken)
 * @returns Transaction hash
 */
export async function updateSwapPrice(
  price: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (!SWAP_CONTRACT_ADDRESS) {
    return { success: false, error: "Swap contract not deployed" };
  }

  if (!RPC_URL) {
    return { success: false, error: "RPC_URL not configured" };
  }

  try {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(RPC_URL),
    });

    // Convert price to uint256: price * 1e18 (TestToken has 18 decimals)
    // Example: price = 1.5 -> 1.5 * 1e18 = 1500000000000000000
    const priceInWei = BigInt(Math.floor(price * 1e18));

    const hash = await walletClient.writeContract({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAP_ABI,
      functionName: "updatePrice",
      args: [priceInWei],
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { success: true, txHash: hash };
  } catch (error: any) {
    console.error("Error updating swap price:", error);
    return {
      success: false,
      error: error?.message || "Failed to update swap price",
    };
  }
}

/**
 * Execute a buy swap (USDC -> TestToken) on behalf of a smart account
 * Note: This requires the smart account to have approved USDC spending
 * @param smartAccountAddress The smart account address
 * @param usdcAmount Amount of USDC to spend (in USDC units, 6 decimals)
 * @returns Transaction hash and amount of TestToken received
 */
export async function executeBuySwap(
  smartAccountAddress: Address,
  usdcAmount: number
): Promise<{
  success: boolean;
  txHash?: string;
  testTokenAmount?: string;
  error?: string;
}> {
  if (!SWAP_CONTRACT_ADDRESS) {
    return { success: false, error: "Swap contract not deployed" };
  }

  if (!RPC_URL) {
    return { success: false, error: "RPC_URL not configured" };
  }

  try {
    // For now, we'll use the backend account to execute the swap
    // In production, you'd use the smart account's signer
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(RPC_URL),
    });

    // Convert USDC amount to wei (USDC has 6 decimals)
    const usdcAmountWei = parseUnits(usdcAmount.toString(), 6);

    // Check allowance first
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [smartAccountAddress, SWAP_CONTRACT_ADDRESS],
    });

    if (allowance < usdcAmountWei) {
      // Need to approve first - but we can't do this from backend without user's signer
      // For now, we'll assume the smart account has already approved
      // In production, you'd need to handle this differently
      return {
        success: false,
        error:
          "Insufficient USDC allowance. Smart account needs to approve swap contract.",
      };
    }

    // Execute swap
    // Note: This requires the smart account to execute, not the backend
    // For now, this is a placeholder - you'd need to use the smart account's signer
    // or have the user sign a transaction
    const hash = await walletClient.writeContract({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAP_ABI,
      functionName: "buy",
      args: [usdcAmountWei],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get the TestToken amount from the event or calculate it
    const testTokenAmount = await publicClient.readContract({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAP_ABI,
      functionName: "getBuyQuote",
      args: [usdcAmountWei],
    });

    return {
      success: true,
      txHash: hash,
      testTokenAmount: formatUnits(testTokenAmount, 18),
    };
  } catch (error: any) {
    console.error("Error executing buy swap:", error);
    return {
      success: false,
      error: error?.message || "Failed to execute buy swap",
    };
  }
}

/**
 * Execute a sell swap (TestToken -> USDC) on behalf of a smart account
 * @param smartAccountAddress The smart account address
 * @param testTokenAmount Amount of TestToken to sell (in TestToken units, 18 decimals)
 * @returns Transaction hash and amount of USDC received
 */
export async function executeSellSwap(
  smartAccountAddress: Address,
  testTokenAmount: number
): Promise<{
  success: boolean;
  txHash?: string;
  usdcAmount?: string;
  error?: string;
}> {
  if (!SWAP_CONTRACT_ADDRESS) {
    return { success: false, error: "Swap contract not deployed" };
  }

  if (!RPC_URL) {
    return { success: false, error: "RPC_URL not configured" };
  }

  try {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(RPC_URL),
    });

    // Convert TestToken amount to wei (18 decimals)
    const testTokenAmountWei = parseUnits(testTokenAmount.toString(), 18);

    // Check allowance
    const testTokenAddress = process.env.TEST_TOKEN_ADDRESS as Address;
    if (!testTokenAddress) {
      return { success: false, error: "Test token address not configured" };
    }

    const allowance = await publicClient.readContract({
      address: testTokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [smartAccountAddress, SWAP_CONTRACT_ADDRESS],
    });

    if (allowance < testTokenAmountWei) {
      return {
        success: false,
        error:
          "Insufficient TestToken allowance. Smart account needs to approve swap contract.",
      };
    }

    // Execute swap
    const hash = await walletClient.writeContract({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAP_ABI,
      functionName: "sell",
      args: [testTokenAmountWei],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get the USDC amount from quote
    const usdcAmount = await publicClient.readContract({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAP_ABI,
      functionName: "getSellQuote",
      args: [testTokenAmountWei],
    });

    return {
      success: true,
      txHash: hash,
      usdcAmount: formatUnits(usdcAmount, 6),
    };
  } catch (error: any) {
    console.error("Error executing sell swap:", error);
    return {
      success: false,
      error: error?.message || "Failed to execute sell swap",
    };
  }
}
