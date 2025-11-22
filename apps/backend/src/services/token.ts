import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  parseEther,
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

// Simple ERC20 Token ABI (minimal interface for transfers)
const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Test token address on Sepolia (using a common test token or deploy our own)
// For now, we'll use USDC on Sepolia or create a simple airdrop contract
const TEST_TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS as
  | Address
  | undefined;

export interface TokenBalance {
  address: Address;
  balance: string;
  decimals: number;
}

/**
 * Airdrops test tokens to a smart account address
 */
export async function airdropTokens(
  recipientAddress: Address,
  amount: string = "1000"
): Promise<{ success: boolean; txHash?: string; error?: string }> {
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

    // If we have a test token address, transfer tokens
    if (TEST_TOKEN_ADDRESS) {
      const hash = await walletClient.writeContract({
        address: TEST_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress, parseEther(amount)],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      return { success: true, txHash: hash };
    }

    // Otherwise, send native ETH as test tokens
    const hash = await walletClient.sendTransaction({
      to: recipientAddress,
      value: parseEther(amount),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return { success: true, txHash: hash };
  } catch (error: any) {
    console.error("Error airdropping tokens:", error);
    return {
      success: false,
      error: error?.message || "Failed to airdrop tokens",
    };
  }
}

/**
 * Gets the token balance for an address
 */
export async function getTokenBalance(
  address: Address
): Promise<TokenBalance | null> {
  if (!RPC_URL || !TEST_TOKEN_ADDRESS) {
    // If no token address, return ETH balance
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo"),
      });

      const balance = await publicClient.getBalance({ address });
      return {
        address: address,
        balance: formatEther(balance),
        decimals: 18,
      };
    } catch (error) {
      console.error("Error getting balance:", error);
      return null;
    }
  }

  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: TEST_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      }),
      publicClient.readContract({
        address: TEST_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      address: TEST_TOKEN_ADDRESS,
      balance: formatEther(balance),
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error("Error getting token balance:", error);
    return null;
  }
}
