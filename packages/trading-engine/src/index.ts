import { Portfolio, DifficultyMode } from "@tradeOS/types";

export function buy(
  portfolio: Portfolio,
  currentPrice: number,
  difficulty: DifficultyMode,
  amount?: number
): Portfolio {
  const positionSize = calculatePositionSize(
    portfolio,
    currentPrice,
    difficulty,
    amount
  );

  if (positionSize <= 0) {
    return portfolio;
  }

  if (portfolio.balanceUSD < positionSize) {
    return portfolio;
  }

  const tokensToBuy = positionSize / currentPrice;
  const newBalanceUSD = portfolio.balanceUSD - positionSize;
  const newBalanceToken = portfolio.balanceToken + tokensToBuy;

  // Update entry price (weighted average)
  const totalValue =
    portfolio.balanceToken * (portfolio.entryPrice || 0) + positionSize;
  const totalTokens = portfolio.balanceToken + tokensToBuy;
  const newEntryPrice =
    totalTokens > 0 ? totalValue / totalTokens : currentPrice;

  return {
    ...portfolio,
    balanceUSD: newBalanceUSD,
    balanceToken: newBalanceToken,
    entryPrice: newEntryPrice,
    totalTrades: portfolio.totalTrades + 1,
  };
}

export function sell(
  portfolio: Portfolio,
  currentPrice: number,
  difficulty: DifficultyMode,
  amount?: number
): Portfolio {
  if (portfolio.balanceToken <= 0) {
    return portfolio;
  }

  let tokensToSell: number;
  if (amount !== undefined) {
    tokensToSell = Math.min(amount, portfolio.balanceToken);
  } else {
    tokensToSell = calculateSellAmount(portfolio, currentPrice, difficulty);
  }

  if (tokensToSell <= 0) {
    return portfolio;
  }

  const usdReceived = tokensToSell * currentPrice;
  const entryValue = tokensToSell * (portfolio.entryPrice || currentPrice);
  const pnl = usdReceived - entryValue;

  const newBalanceUSD = portfolio.balanceUSD + usdReceived;
  const newBalanceToken = portfolio.balanceToken - tokensToSell;
  const newRealizedPnl = portfolio.realizedPnl + pnl;

  // Reset entry price if all tokens sold
  const newEntryPrice = newBalanceToken > 0 ? portfolio.entryPrice : undefined;

  return {
    ...portfolio,
    balanceUSD: newBalanceUSD,
    balanceToken: newBalanceToken,
    realizedPnl: newRealizedPnl,
    entryPrice: newEntryPrice,
    totalTrades: portfolio.totalTrades + 1,
  };
}

export function panicExit(
  portfolio: Portfolio,
  currentPrice: number
): Portfolio {
  if (portfolio.balanceToken <= 0) {
    return portfolio;
  }

  return sell(portfolio, currentPrice, "pro", portfolio.balanceToken);
}

export function getUnrealizedPnl(
  portfolio: Portfolio,
  currentPrice: number
): number {
  if (!portfolio.entryPrice || portfolio.balanceToken <= 0) {
    return 0;
  }

  const currentValue = portfolio.balanceToken * currentPrice;
  const entryValue = portfolio.balanceToken * portfolio.entryPrice;
  return currentValue - entryValue;
}

function calculatePositionSize(
  portfolio: Portfolio,
  currentPrice: number,
  difficulty: DifficultyMode,
  customAmount?: number
): number {
  if (customAmount !== undefined) {
    return customAmount;
  }

  switch (difficulty) {
    case "noob":
      // Fixed size for noobs
      return 50;
    case "degen":
      // Percentage of balance
      return portfolio.balanceUSD * 0.1;
    case "pro":
      // Dynamic based on balance and volatility
      return Math.min(portfolio.balanceUSD * 0.25, portfolio.balanceUSD * 0.5);
    default:
      return 50;
  }
}

function calculateSellAmount(
  portfolio: Portfolio,
  currentPrice: number,
  difficulty: DifficultyMode
): number {
  switch (difficulty) {
    case "noob":
      // Sell half position
      return portfolio.balanceToken * 0.5;
    case "degen":
      // Sell all
      return portfolio.balanceToken;
    case "pro":
      // Sell based on profit target or stop loss
      if (portfolio.entryPrice) {
        const profitPercent =
          ((currentPrice - portfolio.entryPrice) / portfolio.entryPrice) * 100;
        if (profitPercent >= 20) {
          return portfolio.balanceToken * 0.5; // Take profit
        }
        if (profitPercent <= -10) {
          return portfolio.balanceToken; // Stop loss
        }
      }
      return portfolio.balanceToken * 0.3; // Partial sell
    default:
      return portfolio.balanceToken * 0.5;
  }
}

export function validateTrade(
  portfolio: Portfolio,
  currentPrice: number,
  difficulty: DifficultyMode,
  type: "buy" | "sell"
): { valid: boolean; reason?: string } {
  if (type === "buy") {
    const positionSize = calculatePositionSize(
      portfolio,
      currentPrice,
      difficulty
    );
    if (portfolio.balanceUSD < positionSize) {
      return { valid: false, reason: "Insufficient balance" };
    }

    // Safety hook for noob mode
    if (difficulty === "noob") {
      const totalValue =
        portfolio.balanceUSD + portfolio.balanceToken * currentPrice;
      const maxPosition = totalValue * 0.8; // Max 80% in position
      const newPositionValue =
        (portfolio.balanceToken + positionSize / currentPrice) * currentPrice;
      if (newPositionValue > maxPosition) {
        return {
          valid: false,
          reason: "Safety limit: Cannot exceed 80% position size",
        };
      }
    }
  }

  if (type === "sell") {
    if (portfolio.balanceToken <= 0) {
      return { valid: false, reason: "No tokens to sell" };
    }
  }

  return { valid: true };
}
