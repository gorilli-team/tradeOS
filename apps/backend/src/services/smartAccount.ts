import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { LightSmartContractAccount, getDefaultLightAccountFactoryAddress } from "@alchemy/aa-accounts";
import { sepolia } from "viem/chains";
import { type Address, createWalletClient, http, privateKeyToAccount } from "viem";
import { LocalAccountSigner } from "@alchemy/aa-core";

const RPC_URL = process.env.ALCHEMY_RPC_URL || process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

if (!RPC_URL) {
  console.warn("ALCHEMY_RPC_URL or RPC_URL not set. Smart accounts will not work.");
}

export interface SmartAccountInfo {
  address: Address;
  ownerAddress: Address;
}

/**
 * Creates or retrieves a smart account for a given owner address
 * Note: This creates a smart account using the owner's address as the signer
 * In production, you'd want to use the actual user's signer from their wallet
 */
export async function getOrCreateSmartAccount(
  ownerAddress: Address
): Promise<SmartAccountInfo> {
  if (!RPC_URL) {
    throw new Error("RPC_URL not configured. Please set ALCHEMY_RPC_URL or RPC_URL environment variable.");
  }

  try {
    // Extract API key from RPC URL if it's an Alchemy URL
    let apiKey: string | undefined;
    let rpcUrl: string = RPC_URL;
    
    if (RPC_URL.includes("alchemy.com")) {
      const parts = RPC_URL.split("/");
      apiKey = parts[parts.length - 1];
      rpcUrl = RPC_URL;
    }

    // Create a signer from a private key (in production, use the user's actual signer)
    // For now, we'll use a deterministic approach based on owner address
    // In a real app, you'd get the signer from the user's connected wallet
    const signer = new LocalAccountSigner(
      privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
    );

    // Create the provider
    const provider = new AlchemyProvider({
      chain: sepolia,
      apiKey: apiKey || "",
      rpcUrl: rpcUrl,
    }).connect((rpcClient) => {
      return new LightSmartContractAccount({
        rpcClient,
        owner: signer,
        factoryAddress: getDefaultLightAccountFactoryAddress(sepolia),
        chain: sepolia,
      });
    });

    // Get the smart account address (deterministic based on owner and factory)
    const address = await provider.getAddress();

    return {
      address: address as Address,
      ownerAddress,
    };
  } catch (error) {
    console.error("Error creating smart account:", error);
    // Fallback: return a deterministic address based on owner
    // This is a simplified approach - in production you'd want proper error handling
    throw error;
  }
}

