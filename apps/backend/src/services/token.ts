import {
  createPublicClient,
  http,
  createWalletClient,
  formatEther,
  formatUnits,
  parseEther,
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

// USDC on Sepolia testnet
const USDC_ADDRESS = (process.env.USDC_ADDRESS ||
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238") as Address;

// Test token address on Sepolia (the token users will trade)
const TEST_TOKEN_ADDRESS = process.env.TEST_TOKEN_ADDRESS as
  | Address
  | undefined;

export interface TokenBalance {
  address: Address;
  balance: string;
  decimals: number;
}

/**
 * Airdrops USDC to a smart account address
 * Users will use USDC to buy the test token via the swap contract
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

    // Airdrop USDC (6 decimals) - users will use USDC to buy test tokens
    const usdcAmount = parseUnits(amount, 6);

    const hash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipientAddress, usdcAmount],
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
 * Gets the USDC balance for an address
 */
export async function getUSDCBalance(
  address: Address
): Promise<TokenBalance | null> {
  if (!RPC_URL) {
    return null;
  }

  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(RPC_URL),
    });

    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      }),
      publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    return {
      address: USDC_ADDRESS,
      balance: formatUnits(balance, Number(decimals)),
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error("Error getting USDC balance:", error);
    return null;
  }
}

/**
 * Gets the TestToken balance for an address
 */
export async function getTestTokenBalance(
  address: Address
): Promise<TokenBalance | null> {
  if (!RPC_URL || !TEST_TOKEN_ADDRESS) {
    return null;
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
      balance: formatUnits(balance, Number(decimals)),
      decimals: Number(decimals),
    };
  } catch (error) {
    console.error("Error getting TestToken balance:", error);
    return null;
  }
}

/**
 * Gets the token balance for an address (USDC for checking if user can trade)
 * This is used to check if user has tokens to start trading
 */
export async function getTokenBalance(
  address: Address
): Promise<TokenBalance | null> {
  // Check USDC balance (users need USDC to buy test tokens)
  return await getUSDCBalance(address);
}
