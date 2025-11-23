// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../TestToken.sol";
import {Swap} from "../Swap.sol";

contract DeployScript is Script {
    // USDC on Sepolia testnet
    address constant USDC_ADDRESS = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    
    // Initial price: 1 USDC = 1 TestToken (1e18)
    uint256 constant INITIAL_PRICE = 1e18;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy TestToken
        console.log("Deploying TestToken...");
        TestToken testToken = new TestToken();
        console.log("TestToken deployed at:", address(testToken));

        // Deploy Swap contract
        console.log("Deploying Swap contract...");
        Swap swap = new Swap(USDC_ADDRESS, address(testToken), INITIAL_PRICE);
        console.log("Swap deployed at:", address(swap));

        // Mint TestToken to swap contract for liquidity
        // 1,000,000 TestToken
        uint256 liquidityAmount = 1_000_000 * 10**18;
        console.log("Minting TestToken to swap contract...");
        testToken.mint(address(swap), liquidityAmount);
        console.log("Minted", liquidityAmount / 10**18, "TestToken to swap");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("TestToken:", address(testToken));
        console.log("Swap:", address(swap));
        console.log("USDC:", USDC_ADDRESS);
        console.log("Initial Price: 1 USDC = 1 TestToken");
        console.log("\nNext steps:");
        console.log("1. Transfer USDC to swap contract for liquidity");
        console.log("2. Update backend .env with contract addresses");
    }
}

