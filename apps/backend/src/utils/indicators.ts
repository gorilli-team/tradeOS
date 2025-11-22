import { PriceTick } from "@tradeOS/types";

/**
 * Calculate RSI (Relative Strength Index) from price history
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
 * Calculate moving average
 */
export function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.length > 0 ? prices[prices.length - 1] : 0;
  }
  const recent = prices.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

/**
 * Calculate price momentum (percentage change)
 */
export function calculateMomentum(
  prices: number[],
  period: number = 10
): number {
  if (prices.length < period + 1) {
    return 0;
  }
  const recent = prices.slice(-period);
  const change = recent[recent.length - 1] - recent[0];
  return (change / recent[0]) * 100;
}

/**
 * Calculate volatility (standard deviation as percentage)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) {
    return 0;
  }
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squareDiffs = prices.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  return (stdDev / mean) * 100;
}

/**
 * Calculate buy frequency from trades
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
 * Generate comprehensive trading signals
 */
export function generateTradingSignals(
  priceHistory: PriceTick[],
  buyTimestamps: number[] = []
): {
  rsi: number;
  rsiSignal: "oversold" | "overbought" | "neutral" | "bullish" | "bearish";
  momentum: number;
  volatility: number;
  movingAverage: number;
  currentPrice: number;
  priceChange24h: number;
  trend: string;
  buyFrequency: number;
  aiSignal: {
    signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
    confidence: number;
    reasoning: string;
  };
} {
  if (priceHistory.length === 0) {
    return {
      rsi: 50,
      rsiSignal: "neutral",
      momentum: 0,
      volatility: 0,
      movingAverage: 0,
      currentPrice: 0,
      priceChange24h: 0,
      trend: "sideways",
      buyFrequency: 0,
      aiSignal: {
        signal: "hold",
        confidence: 50,
        reasoning: "Insufficient data",
      },
    };
  }

  const prices = priceHistory.map((t) => t.price);
  const currentPrice = prices[prices.length - 1];
  const rsi = calculateRSI(prices);
  const momentum = calculateMomentum(prices);
  const volatility = calculateVolatility(prices.slice(-20));
  const movingAverage = calculateMA(prices, 20);
  const priceChange24h =
    prices.length > 1 ? ((currentPrice - prices[0]) / prices[0]) * 100 : 0;
  const trend = priceHistory[priceHistory.length - 1]?.trend || "sideways";
  const buyFrequency = calculateBuyFrequency(buyTimestamps);

  // RSI signal
  let rsiSignal: "oversold" | "overbought" | "neutral" | "bullish" | "bearish";
  if (rsi < 30) rsiSignal = "oversold";
  else if (rsi > 70) rsiSignal = "overbought";
  else if (rsi > 50) rsiSignal = "bullish";
  else if (rsi < 50) rsiSignal = "bearish";
  else rsiSignal = "neutral";

  // AI signal calculation
  let score = 50; // Neutral starting point

  // RSI component
  if (rsi < 30) score += 20;
  else if (rsi > 70) score -= 20;
  else if (rsi < 50) score += 10;
  else score -= 10;

  // Momentum component
  if (momentum > 5) score += 15;
  else if (momentum > 2) score += 10;
  else if (momentum < -5) score -= 15;
  else if (momentum < -2) score -= 10;

  // Trend component
  if (trend === "up") score += 10;
  else if (trend === "down") score -= 10;
  else if (trend === "whale") score += 5;
  else if (trend === "rug") score -= 15;

  // Buy frequency component
  if (buyFrequency > 2) score += 5;
  else if (buyFrequency < 0.5) score -= 5;

  // Volatility adjustment
  if (volatility > 10) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  if (score >= 80) signal = "strong_buy";
  else if (score >= 65) signal = "buy";
  else if (score >= 35) signal = "hold";
  else if (score >= 20) signal = "sell";
  else signal = "strong_sell";

  const reasons: string[] = [];
  if (rsi < 30) reasons.push("RSI indicates oversold conditions");
  if (rsi > 70) reasons.push("RSI indicates overbought conditions");
  if (momentum > 5) reasons.push("Strong upward momentum detected");
  if (momentum < -5) reasons.push("Strong downward momentum detected");
  if (trend === "rug") reasons.push("Rug pull pattern detected");
  if (buyFrequency > 2) reasons.push("High buy activity");
  if (volatility > 10) reasons.push("High volatility warning");

  const reasoning =
    reasons.length > 0 ? reasons.join("; ") : "Market conditions are neutral";

  return {
    rsi,
    rsiSignal,
    momentum,
    volatility,
    movingAverage,
    currentPrice,
    priceChange24h,
    trend,
    buyFrequency,
    aiSignal: {
      signal,
      confidence: Math.round(score),
      reasoning,
    },
  };
}
