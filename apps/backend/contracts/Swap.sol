// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Swap
 * @dev Simple swap contract for trading USDC <-> TestToken at a price set by the backend
 * The price is determined by the simulation and can be updated by the owner (backend)
 */
contract Swap is Ownable {
    IERC20 public immutable usdc;
    IERC20 public immutable testToken;

    // Current price: amount of TestToken per 1 USDC (with 6 decimals for USDC, 18 for TestToken)
    // Example: price = 1e18 means 1 USDC = 1 TestToken
    // price = 2e18 means 1 USDC = 2 TestToken
    uint256 public price; // Price in TestToken per USDC (scaled by 1e18)

    event SwapExecuted(
        address indexed user,
        bool isBuy, // true = USDC -> TestToken, false = TestToken -> USDC
        uint256 amountIn,
        uint256 amountOut,
        uint256 currentPrice
    );

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(
        address _usdc,
        address _testToken,
        uint256 _initialPrice
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        testToken = IERC20(_testToken);
        price = _initialPrice;
    }

    /**
     * @dev Update the swap price (called by backend based on simulation)
     * @param _newPrice New price in TestToken per USDC (scaled by 1e18)
     */
    function updatePrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        uint256 oldPrice = price;
        price = _newPrice;
        emit PriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Buy TestToken with USDC
     * @param usdcAmount Amount of USDC to spend (6 decimals)
     * @return testTokenAmount Amount of TestToken received (18 decimals)
     */
    function buy(
        uint256 usdcAmount
    ) external returns (uint256 testTokenAmount) {
        require(usdcAmount > 0, "Amount must be greater than 0");
        require(
            usdc.balanceOf(address(this)) >= usdcAmount,
            "Insufficient USDC in contract"
        );

        // Calculate TestToken amount: (usdcAmount * price) / 1e6
        // USDC has 6 decimals, TestToken has 18 decimals
        // We need to scale: (usdcAmount * 1e12) * price / 1e18 = usdcAmount * price / 1e6
        testTokenAmount = (usdcAmount * price) / 1e6;

        require(
            testToken.balanceOf(address(this)) >= testTokenAmount,
            "Insufficient TestToken in contract"
        );

        // Transfer USDC from user to contract
        require(
            usdc.transferFrom(msg.sender, address(this), usdcAmount),
            "USDC transfer failed"
        );

        // Transfer TestToken from contract to user
        require(
            testToken.transfer(msg.sender, testTokenAmount),
            "TestToken transfer failed"
        );

        emit SwapExecuted(msg.sender, true, usdcAmount, testTokenAmount, price);

        return testTokenAmount;
    }

    /**
     * @dev Sell TestToken for USDC
     * @param testTokenAmount Amount of TestToken to sell (18 decimals)
     * @return usdcAmount Amount of USDC received (6 decimals)
     */
    function sell(
        uint256 testTokenAmount
    ) external returns (uint256 usdcAmount) {
        require(testTokenAmount > 0, "Amount must be greater than 0");
        require(
            testToken.balanceOf(address(this)) >= testTokenAmount,
            "Insufficient TestToken in contract"
        );

        // Calculate USDC amount: (testTokenAmount * 1e6) / price
        // Reverse of buy: we need to convert back to USDC
        usdcAmount = (testTokenAmount * 1e6) / price;

        require(
            usdc.balanceOf(address(this)) >= usdcAmount,
            "Insufficient USDC in contract"
        );

        // Transfer TestToken from user to contract
        require(
            testToken.transferFrom(msg.sender, address(this), testTokenAmount),
            "TestToken transfer failed"
        );

        // Transfer USDC from contract to user
        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");

        emit SwapExecuted(
            msg.sender,
            false,
            testTokenAmount,
            usdcAmount,
            price
        );

        return usdcAmount;
    }

    /**
     * @dev Get quote for buying TestToken with USDC
     */
    function getBuyQuote(
        uint256 usdcAmount
    ) external view returns (uint256 testTokenAmount) {
        return (usdcAmount * price) / 1e6;
    }

    /**
     * @dev Get quote for selling TestToken for USDC
     */
    function getSellQuote(
        uint256 testTokenAmount
    ) external view returns (uint256 usdcAmount) {
        return (testTokenAmount * 1e6) / price;
    }

    /**
     * @dev Deposit USDC and TestToken to the swap contract (for liquidity)
     * Only owner can deposit
     */
    function depositLiquidity(
        uint256 usdcAmount,
        uint256 testTokenAmount
    ) external onlyOwner {
        require(
            usdc.transferFrom(msg.sender, address(this), usdcAmount),
            "USDC transfer failed"
        );
        require(
            testToken.transferFrom(msg.sender, address(this), testTokenAmount),
            "TestToken transfer failed"
        );
    }

    /**
     * @dev Withdraw USDC and TestToken from the swap contract
     * Only owner can withdraw
     */
    function withdrawLiquidity(
        uint256 usdcAmount,
        uint256 testTokenAmount
    ) external onlyOwner {
        if (usdcAmount > 0) {
            require(
                usdc.transfer(msg.sender, usdcAmount),
                "USDC transfer failed"
            );
        }
        if (testTokenAmount > 0) {
            require(
                testToken.transfer(msg.sender, testTokenAmount),
                "TestToken transfer failed"
            );
        }
    }
}
