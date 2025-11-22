import { type Address } from "viem";
import { airdropTokens, getTokenBalance } from "./token";
import { getOrCreateSmartAccount } from "./smartAccount";

export interface AirdropResult {
  success: boolean;
  smartAccountAddress?: Address;
  txHash?: string;
  error?: string;
  balance?: string;
}

/**
 * Creates a smart account and airdrops test tokens to it
 */
export async function createAccountAndAirdrop(
  ownerAddress: Address,
  tokenAmount: string = "1000"
): Promise<AirdropResult> {
  try {
    // Step 1: Create or get smart account
    console.log(`Creating smart account for owner: ${ownerAddress}`);
    const smartAccount = await getOrCreateSmartAccount(ownerAddress);
    console.log(`Smart account created: ${smartAccount.address}`);

    // Step 2: Airdrop tokens to the smart account
    console.log(`Airdropping ${tokenAmount} tokens to ${smartAccount.address}`);
    const airdropResult = await airdropTokens(smartAccount.address, tokenAmount);

    if (!airdropResult.success) {
      return {
        success: false,
        smartAccountAddress: smartAccount.address,
        error: airdropResult.error,
      };
    }

    // Step 3: Get the balance to confirm
    const balance = await getTokenBalance(smartAccount.address);

    return {
      success: true,
      smartAccountAddress: smartAccount.address,
      txHash: airdropResult.txHash,
      balance: balance?.balance || "0",
    };
  } catch (error: any) {
    console.error("Error in createAccountAndAirdrop:", error);
    return {
      success: false,
      error: error?.message || "Failed to create account and airdrop",
    };
  }
}

