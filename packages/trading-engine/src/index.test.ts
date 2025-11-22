import { buy, sell, panicExit, getUnrealizedPnl, validateTrade } from "./index";
import { Portfolio, DifficultyMode } from "tradeOS/types";

describe("TradingEngine", () => {
  const initialPortfolio: Portfolio = {
    balanceUSD: 1000,
    balanceToken: 0,
    realizedPnl: 0,
    totalTrades: 0,
  };

  describe("buy", () => {
    test("should buy tokens with fixed size in noob mode", () => {
      const result = buy(initialPortfolio, 1.0, "noob");
      expect(result.balanceUSD).toBe(950);
      expect(result.balanceToken).toBe(50);
      expect(result.entryPrice).toBe(1.0);
      expect(result.totalTrades).toBe(1);
    });

    test("should buy tokens with percentage in degen mode", () => {
      const result = buy(initialPortfolio, 1.0, "degen");
      expect(result.balanceUSD).toBe(900);
      expect(result.balanceToken).toBe(100);
      expect(result.totalTrades).toBe(1);
    });

    test("should not buy if insufficient balance", () => {
      const poorPortfolio: Portfolio = { ...initialPortfolio, balanceUSD: 10 };
      const result = buy(poorPortfolio, 1.0, "noob");
      expect(result.balanceUSD).toBe(10);
      expect(result.balanceToken).toBe(0);
    });
  });

  describe("sell", () => {
    test("should sell tokens and calculate PnL", () => {
      const portfolioWithTokens: Portfolio = {
        balanceUSD: 500,
        balanceToken: 100,
        entryPrice: 1.0,
        realizedPnl: 0,
        totalTrades: 1,
      };
      const result = sell(portfolioWithTokens, 1.5, "noob");
      expect(result.balanceToken).toBe(50);
      expect(result.balanceUSD).toBe(575); // 500 + (50 * 1.5)
      expect(result.realizedPnl).toBe(25); // 50 * (1.5 - 1.0)
      expect(result.totalTrades).toBe(2);
    });

    test("should not sell if no tokens", () => {
      const result = sell(initialPortfolio, 1.0, "noob");
      expect(result).toEqual(initialPortfolio);
    });
  });

  describe("panicExit", () => {
    test("should sell all tokens", () => {
      const portfolioWithTokens: Portfolio = {
        balanceUSD: 500,
        balanceToken: 100,
        entryPrice: 1.0,
        realizedPnl: 0,
        totalTrades: 1,
      };
      const result = panicExit(portfolioWithTokens, 1.5);
      expect(result.balanceToken).toBe(0);
      expect(result.balanceUSD).toBe(650);
    });
  });

  describe("getUnrealizedPnl", () => {
    test("should calculate unrealized profit", () => {
      const portfolio: Portfolio = {
        balanceUSD: 500,
        balanceToken: 100,
        entryPrice: 1.0,
        realizedPnl: 0,
        totalTrades: 1,
      };
      const pnl = getUnrealizedPnl(portfolio, 1.5);
      expect(pnl).toBe(50); // 100 * (1.5 - 1.0)
    });

    test("should return 0 if no entry price", () => {
      const pnl = getUnrealizedPnl(initialPortfolio, 1.5);
      expect(pnl).toBe(0);
    });
  });

  describe("validateTrade", () => {
    test("should validate buy trade", () => {
      const result = validateTrade(initialPortfolio, 1.0, "noob", "buy");
      expect(result.valid).toBe(true);
    });

    test("should reject buy if insufficient balance", () => {
      const poorPortfolio: Portfolio = { ...initialPortfolio, balanceUSD: 10 };
      const result = validateTrade(poorPortfolio, 1.0, "noob", "buy");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Insufficient");
    });

    test("should reject sell if no tokens", () => {
      const result = validateTrade(initialPortfolio, 1.0, "noob", "sell");
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("No tokens");
    });
  });
});
