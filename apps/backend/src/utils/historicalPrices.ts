import { PriceTick, TrendSignal } from "@tradeOS/types";

/**
 * Generate historical price data to simulate a pre-existing token
 * @param initialPrice Starting price
 * @param hours Number of hours of history to generate
 * @param intervalMinutes Interval between price points in minutes
 * @returns Array of PriceTick objects
 */
export function generateHistoricalPrices(
  initialPrice: number = 1.0,
  hours: number = 24,
  intervalMinutes: number = 1
): PriceTick[] {
  const prices: PriceTick[] = [];
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  const totalPoints = (hours * 60) / intervalMinutes;
  
  let currentPrice = initialPrice;
  const volatility = 0.015; // 1.5% volatility per tick
  
  // Generate prices going backwards in time
  for (let i = totalPoints; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.45) * volatility; // Slight upward bias
    currentPrice = currentPrice * (1 + change);
    
    // Ensure price doesn't go below 0.1
    currentPrice = Math.max(0.1, currentPrice);
    
    // Determine trend
    let trend: TrendSignal = "sideways";
    if (i > 0) {
      const prevPrice = prices.length > 0 ? prices[prices.length - 1].price : initialPrice;
      const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;
      
      if (priceChange > 2) {
        trend = "up";
      } else if (priceChange < -2) {
        trend = "down";
      } else if (Math.random() > 0.95) {
        trend = Math.random() > 0.5 ? "whale" : "rug";
      } else {
        trend = "sideways";
      }
    }
    
    prices.push({
      price: Math.round(currentPrice * 10000) / 10000, // Round to 4 decimals
      timestamp,
      trend,
    });
  }
  
  return prices;
}

