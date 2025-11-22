import { PriceTick } from "@tradeOS/types";

/**
 * Calculate RSI (Relative Strength Index) from price history
 * @param prices Array of prices
 * @param period Period for RSI calculation (default 14)
 * @returns RSI value between 0-100
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral RSI if not enough data
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (const change of changes) {
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate average gain and loss over the period
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = gains.length - period; i < gains.length; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) {
    return 100; // All gains, no losses
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.round(rsi * 100) / 100;
}

/**
 * Get RSI signal interpretation
 */
export function getRSISignal(rsi: number): {
  signal: "oversold" | "overbought" | "neutral" | "bullish" | "bearish";
  color: string;
  label: string;
} {
  if (rsi < 30) {
    return {
      signal: "oversold",
      color: "text-green-400",
      label: "Oversold (Buy)",
    };
  } else if (rsi > 70) {
    return {
      signal: "overbought",
      color: "text-red-400",
      label: "Overbought (Sell)",
    };
  } else if (rsi > 50) {
    return {
      signal: "bullish",
      color: "text-green-300",
      label: "Bullish",
    };
  } else if (rsi < 50) {
    return {
      signal: "bearish",
      color: "text-red-300",
      label: "Bearish",
    };
  }
  return {
    signal: "neutral",
    color: "text-gray-400",
    label: "Neutral",
  };
}

/**
 * Calculate buy frequency (buys per minute)
 */
export function calculateBuyFrequency(
  buyTimestamps: number[],
  timeWindowMinutes: number = 5
): number {
  if (buyTimestamps.length === 0) return 0;

  const now = Date.now();
  const windowStart = now - timeWindowMinutes * 60 * 1000;

  const recentBuys = buyTimestamps.filter((ts) => ts >= windowStart);

  return recentBuys.length / timeWindowMinutes;
}

/**
 * Generate AI trading signal based on multiple indicators
 */
export function generateAISignal(
  priceHistory: PriceTick[],
  rsi: number,
  buyFrequency: number,
  currentPrice: number
): {
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  reasoning: string;
  color: string;
} {
  if (priceHistory.length < 10) {
    return {
      signal: "hold",
      confidence: 50,
      reasoning: "Insufficient data",
      color: "text-gray-400",
    };
  }

  // Calculate price momentum
  const recentPrices = priceHistory.slice(-10).map((t) => t.price);
  const priceChange = ((currentPrice - recentPrices[0]) / recentPrices[0]) * 100;

  // Calculate volatility
  const priceStdDev = calculateStandardDeviation(recentPrices);
  const volatility = (priceStdDev / currentPrice) * 100;

  // Trend analysis
  const trend = priceHistory[priceHistory.length - 1]?.trend || "sideways";

  // Score components
  let score = 50; // Neutral starting point

  // RSI component (0-30 points)
  if (rsi < 30) score += 20; // Oversold = bullish
  else if (rsi > 70) score -= 20; // Overbought = bearish
  else if (rsi < 50) score += 10; // Slightly bullish
  else score -= 10; // Slightly bearish

  // Momentum component (0-20 points)
  if (priceChange > 5) score += 15; // Strong upward momentum
  else if (priceChange > 2) score += 10;
  else if (priceChange < -5) score -= 15; // Strong downward momentum
  else if (priceChange < -2) score -= 10;

  // Trend component (0-15 points)
  if (trend === "up") score += 10;
  else if (trend === "down") score -= 10;
  else if (trend === "whale") score += 5; // Whale activity can be bullish
  else if (trend === "rug") score -= 15; // Rug pull is very bearish

  // Buy frequency component (0-10 points)
  // High buy frequency can indicate FOMO or strong demand
  if (buyFrequency > 2) score += 5;
  else if (buyFrequency < 0.5) score -= 5;

  // Volatility adjustment (0-5 points)
  if (volatility > 10) score -= 5; // High volatility = risk

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine signal
  let signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  let color: string;

  if (score >= 80) {
    signal = "strong_buy";
    color = "text-green-400";
  } else if (score >= 65) {
    signal = "buy";
    color = "text-green-300";
  } else if (score >= 35) {
    signal = "hold";
    color = "text-gray-400";
  } else if (score >= 20) {
    signal = "sell";
    color = "text-red-300";
  } else {
    signal = "strong_sell";
    color = "text-red-400";
  }

  // Generate reasoning
  const reasons: string[] = [];
  if (rsi < 30) reasons.push("RSI indicates oversold conditions");
  if (rsi > 70) reasons.push("RSI indicates overbought conditions");
  if (priceChange > 5) reasons.push("Strong upward momentum detected");
  if (priceChange < -5) reasons.push("Strong downward momentum detected");
  if (trend === "rug") reasons.push("Rug pull pattern detected");
  if (buyFrequency > 2) reasons.push("High buy activity");
  if (volatility > 10) reasons.push("High volatility warning");

  const reasoning =
    reasons.length > 0
      ? reasons.join("; ")
      : "Market conditions are neutral";

  return {
    signal,
    confidence: Math.round(score),
    reasoning,
    color,
  };
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

