// Load environment variables first
import "dotenv/config";

import express from "express";
import { WebSocketServer, WebSocket as WS } from "ws";
import cors from "cors";
import { createServer } from "http";
import { PriceSimulator } from "@tradeOS/price-simulator";
import {
  buy,
  sell,
  panicExit,
  getUnrealizedPnl,
  validateTrade,
} from "@tradeOS/trading-engine";
// We'll need to calculate position size manually since it's not exported
import { calculateXP, calculateLevel } from "@tradeOS/utils";
import {
  UserState,
  PriceTick,
  TradeRequest,
  TradeResponse,
  GameState,
  DeviceSignal,
  DifficultyMode,
  TrendSignal,
} from "@tradeOS/types";
import { z } from "zod";
import { createAccountAndAirdrop } from "./services/airdrop";
import { type Address } from "viem";
import { generateHistoricalPrices } from "./utils/historicalPrices";
import connectDB from "./db/connection";
import Trade from "./models/Trade";
import User from "./models/User";
import { getTokenBalance } from "./services/token";
import mongoose from "mongoose";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Connect to MongoDB (with error handling)
connectDB()
  .then(() => {
    console.log("✅ MongoDB ready for use");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    console.warn("⚠️  App will continue but trades won't be saved to database");
    console.warn("⚠️  To fix: Start MongoDB or set MONGODB_URI environment variable");
  });

// In-memory state (in production, use a database)
const users = new Map<string, UserState>();
const priceSimulators = new Map<string, PriceSimulator>();
const smartAccounts = new Map<string, Address>(); // userId -> smartAccountAddress

// Initialize default user
function createUser(
  userId: string,
  difficulty: DifficultyMode = "noob"
): UserState {
  return {
    userId,
    portfolio: {
      balanceUSD: 1000,
      balanceToken: 0,
      realizedPnl: 0,
      totalTrades: 0,
    },
    level: 1,
    xp: 0,
    difficulty,
    sessionStartTime: Date.now(),
  };
}

// Price tick schema
const PriceTickSchema = z.object({
  price: z.number(),
  timestamp: z.number(),
  trend: z.enum(["up", "down", "sideways", "whale", "rug"]),
});

// Trade request schema
const TradeRequestSchema = z.object({
  userId: z.string(),
  type: z.enum(["buy", "sell", "panic"]),
  amount: z.number().optional(),
});

// REST Endpoints

app.post("/trade/buy", async (req: express.Request, res: express.Response) => {
  try {
    const data = TradeRequestSchema.parse(req.body);
    const user = users.get(data.userId) || createUser(data.userId);
    const smartAccountAddress = smartAccounts.get(data.userId);

    const simulator = priceSimulators.get(data.userId);
    if (!simulator) {
      return res.status(400).json({ error: "Price simulator not started" });
    }

    // Check if user has tokens on chain
    if (smartAccountAddress) {
      const balance = await getTokenBalance(smartAccountAddress as Address);
      if (!balance || parseFloat(balance.balance) === 0) {
        return res.status(400).json({
          success: false,
          error: "No tokens on chain. Please get tokens first.",
        } as TradeResponse);
      }
    }

    const currentPrice = simulator.getCurrentPrice();
    const validation = validateTrade(
      user.portfolio,
      currentPrice,
      user.difficulty,
      "buy"
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.reason,
      } as TradeResponse);
    }

    // Calculate position size
    const positionSize = data.amount !== undefined
      ? data.amount
      : user.difficulty === "noob"
      ? 50
      : user.difficulty === "degen"
      ? user.portfolio.balanceUSD * 0.1
      : Math.min(user.portfolio.balanceUSD * 0.25, user.portfolio.balanceUSD * 0.5);
    const newPortfolio = buy(
      user.portfolio,
      currentPrice,
      user.difficulty,
      data.amount
    );
    const pnlChange = newPortfolio.realizedPnl - user.portfolio.realizedPnl;

    // Calculate points (based on trade size and difficulty)
    const pointsEarned = Math.floor(positionSize * (user.difficulty === "pro" ? 2 : user.difficulty === "degen" ? 1.5 : 1));

    if (pnlChange > 0) {
      const xpGain = calculateXP(pnlChange, user.difficulty);
      user.xp += xpGain;
      user.level = calculateLevel(user.xp);
    }

    user.portfolio = newPortfolio;
    users.set(data.userId, user);

    // Save trade to MongoDB (fail gracefully if not connected)
    try {
      if (mongoose.connection.readyState === 1) {
        const trade = new Trade({
          userId: data.userId,
          walletAddress: data.userId,
          smartAccountAddress: smartAccountAddress,
          type: "buy",
          price: currentPrice,
          usdValue: positionSize,
          difficulty: user.difficulty,
          pointsEarned: pointsEarned,
          isAI: false,
        });
        await trade.save();

        // Update user stats
        await User.findOneAndUpdate(
          { walletAddress: data.userId },
          {
            $inc: { totalPoints: pointsEarned, totalTrades: 1, totalVolume: positionSize },
            $set: { lastActive: new Date() },
          },
          { upsert: true, new: true }
        );
      } else {
        console.warn("⚠️  MongoDB not connected, trade not saved to database");
      }
    } catch (dbError: any) {
      console.error("Error saving trade to DB:", dbError?.message || dbError);
      // Continue even if DB save fails
    }

    // Broadcast device signal
    broadcastDeviceSignal(data.userId, {
      type: "led",
      color: "green",
    });

    res.json({
      success: true,
      portfolio: newPortfolio,
      pointsEarned,
    } as TradeResponse);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/trade/sell", async (req: express.Request, res: express.Response) => {
  try {
    const data = TradeRequestSchema.parse(req.body);
    const user = users.get(data.userId) || createUser(data.userId);
    const smartAccountAddress = smartAccounts.get(data.userId);

    const simulator = priceSimulators.get(data.userId);
    if (!simulator) {
      return res.status(400).json({ error: "Price simulator not started" });
    }

    const currentPrice = simulator.getCurrentPrice();
    const validation = validateTrade(
      user.portfolio,
      currentPrice,
      user.difficulty,
      "sell"
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.reason,
      } as TradeResponse);
    }

    const tokensToSell = data.amount !== undefined
      ? data.amount
      : user.difficulty === "noob"
      ? user.portfolio.balanceToken * 0.5
      : user.difficulty === "degen"
      ? user.portfolio.balanceToken * 0.5
      : user.portfolio.balanceToken * 0.5;

    const newPortfolio = sell(
      user.portfolio,
      currentPrice,
      user.difficulty,
      data.amount
    );
    const pnlChange = newPortfolio.realizedPnl - user.portfolio.realizedPnl;
    const usdValue = tokensToSell * currentPrice;

    // Calculate points
    const pointsEarned = Math.floor(usdValue * (user.difficulty === "pro" ? 2 : user.difficulty === "degen" ? 1.5 : 1));
    // Bonus points for profitable trades
    const profitBonus = pnlChange > 0 ? Math.floor(pnlChange * 0.1) : 0;
    const totalPoints = pointsEarned + profitBonus;

    if (pnlChange > 0) {
      const xpGain = calculateXP(pnlChange, user.difficulty);
      user.xp += xpGain;
      const oldLevel = user.level;
      user.level = calculateLevel(user.xp);

      if (user.level > oldLevel) {
        broadcastDeviceSignal(data.userId, {
          type: "notification",
          message: `Level up! You're now level ${user.level}`,
          level: user.level,
        });
      }
    }

    user.portfolio = newPortfolio;
    users.set(data.userId, user);

    // Save trade to MongoDB (fail gracefully if not connected)
    try {
      if (mongoose.connection.readyState === 1) {
        const trade = new Trade({
          userId: data.userId,
          walletAddress: data.userId,
          smartAccountAddress: smartAccountAddress,
          type: "sell",
          price: currentPrice,
          amount: tokensToSell,
          usdValue: usdValue,
          difficulty: user.difficulty,
          pointsEarned: totalPoints,
          isAI: false,
        });
        await trade.save();

        // Update user stats
        await User.findOneAndUpdate(
          { walletAddress: data.userId },
          {
            $inc: { totalPoints: totalPoints, totalTrades: 1, totalVolume: usdValue },
            $set: { lastActive: new Date() },
          },
          { upsert: true, new: true }
        );
      } else {
        console.warn("⚠️  MongoDB not connected, trade not saved to database");
      }
    } catch (dbError: any) {
      console.error("Error saving trade to DB:", dbError?.message || dbError);
      // Continue even if DB save fails
    }

    // Broadcast device signal
    broadcastDeviceSignal(data.userId, {
      type: "led",
      color: "red",
    });

    res.json({
      success: true,
      portfolio: newPortfolio,
      pointsEarned: totalPoints,
    } as TradeResponse);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/state", (req: express.Request, res: express.Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  const user = users.get(userId) || createUser(userId);
  const simulator = priceSimulators.get(userId);
  const smartAccountAddress = smartAccounts.get(userId);

  if (!simulator) {
    return res.status(400).json({ error: "Price simulator not started" });
  }

  const currentPrice = simulator.getCurrentPrice();
  const unrealizedPnl = getUnrealizedPnl(user.portfolio, currentPrice);

  const gameState: GameState = {
    user,
    currentPrice,
    priceHistory: [], // Could maintain history if needed
    unrealizedPnl,
  };

  res.json({
    ...gameState,
    smartAccountAddress,
  });
});

app.post(
  "/session/start",
  async (req: express.Request, res: express.Response) => {
    const userId = req.body.userId || "default";
    const difficulty = (req.body.difficulty || "noob") as DifficultyMode;
    const ownerAddress = req.body.ownerAddress as Address | undefined;

    // Stop existing simulator if any
    const existingSimulator = priceSimulators.get(userId);
    if (existingSimulator) {
      existingSimulator.stop();
    }

    // Create or reset user
    const user = createUser(userId, difficulty);
    users.set(userId, user);

    // Create smart account and airdrop tokens if owner address is provided
    let smartAccountAddress: Address | undefined;
    let airdropResult:
      | { success: boolean; txHash?: string; error?: string }
      | undefined;

    if (ownerAddress) {
      try {
        console.log(
          `Creating smart account for user ${userId} with owner ${ownerAddress}`
        );
        const result = await createAccountAndAirdrop(ownerAddress, "1000");

        if (result.success && result.smartAccountAddress) {
          smartAccountAddress = result.smartAccountAddress;
          smartAccounts.set(userId, smartAccountAddress);
          airdropResult = {
            success: true,
            txHash: result.txHash,
          };
          console.log(
            `Smart account created: ${smartAccountAddress}, Airdrop tx: ${result.txHash}`
          );
        } else {
          console.error(`Failed to create smart account: ${result.error}`);
          airdropResult = {
            success: false,
            error: result.error,
          };
        }
      } catch (error: any) {
        console.error("Error creating smart account:", error);
        airdropResult = {
          success: false,
          error: error?.message || "Unknown error",
        };
      }
    }

    // Generate historical prices (24 hours of data, 1-minute intervals)
    const historicalPrices = generateHistoricalPrices(1.0, 24, 1);
    const lastHistoricalPrice =
      historicalPrices[historicalPrices.length - 1]?.price || 1.0;

    // Start price simulator with the last historical price as initial
    const simulator = new PriceSimulator({
      initialPrice: lastHistoricalPrice,
      volatility: 0.02,
      difficulty,
      tickInterval: 1000,
    });

    priceSimulators.set(userId, simulator);

    // Send initial historical prices to all connected clients
    const userClients = clients.get(userId);
    if (userClients) {
      historicalPrices.forEach((tick) => {
        const message = JSON.stringify({ type: "price", data: tick });
        userClients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(message);
          }
        });
      });
    }

    simulator.start((price: number, trend: TrendSignal) => {
      const tick: PriceTick = {
        price,
        timestamp: Date.now(),
        trend,
      };

      // Broadcast price update to WebSocket clients
      broadcastPriceUpdate(userId, tick);

      // Broadcast device signal based on trend
      const colorMap: Record<
        TrendSignal,
        "green" | "red" | "yellow" | "purple" | "orange"
      > = {
        up: "green",
        down: "red",
        sideways: "yellow",
        whale: "purple",
        rug: "orange",
      };

      broadcastDeviceSignal(userId, {
        type: "led",
        color: colorMap[trend],
      });
    });

    res.json({
      success: true,
      userId,
      difficulty,
      smartAccountAddress,
      airdrop: airdropResult,
      initialPriceHistory: historicalPrices, // Send initial history
    });
  }
);

app.post("/session/reset", (req: express.Request, res: express.Response) => {
  const userId = req.body.userId || "default";

  const simulator = priceSimulators.get(userId);
  if (simulator) {
    simulator.stop();
    priceSimulators.delete(userId);
  }

  users.delete(userId);
  res.json({ success: true });
});

// WebSocket handling
const clients = new Map<string, Set<any>>();

wss.on("connection", (ws: any) => {
  console.log("WebSocket client connected");

  ws.on("message", (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "subscribe" && data.userId) {
        if (!clients.has(data.userId)) {
          clients.set(data.userId, new Set());
        }
        clients.get(data.userId)!.add(ws);
      }
    } catch (error: unknown) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    // Remove from all user subscriptions
    for (const [userId, userClients] of clients.entries()) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
  });
});

function broadcastPriceUpdate(userId: string, tick: PriceTick): void {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify({ type: "price", data: tick });
    userClients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  }
}

function broadcastDeviceSignal(userId: string, signal: DeviceSignal): void {
  const userClients = clients.get(userId);
  if (userClients) {
    const message = JSON.stringify({ type: "device", data: signal });
    userClients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
      }
    });
  }
}

// Check token balance endpoint
app.get("/tokens/balance", async (req: express.Request, res: express.Response) => {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    const balance = await getTokenBalance(address as Address);
    res.json({ balance: balance?.balance || "0", hasTokens: parseFloat(balance?.balance || "0") > 0 });
  } catch (error) {
    console.error("Error checking balance:", error);
    res.status(500).json({ error: "Failed to check balance" });
  }
});

// Get user points
app.get("/user/points", async (req: express.Request, res: express.Response) => {
  try {
    const walletAddress = req.query.walletAddress as string;
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress required" });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        points: 0,
        totalTrades: 0,
        totalVolume: 0,
      });
    }

    const user = await User.findOne({ walletAddress });
    res.json({
      points: user?.totalPoints || 0,
      totalTrades: user?.totalTrades || 0,
      totalVolume: user?.totalVolume || 0,
    });
  } catch (error) {
    console.error("Error getting user points:", error);
    res.json({
      points: 0,
      totalTrades: 0,
      totalVolume: 0,
    });
  }
});

// Get leaderboard
app.get("/leaderboard", async (req: express.Request, res: express.Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const includeAI = req.query.includeAI === "true";

    if (mongoose.connection.readyState !== 1) {
      return res.json({ leaderboard: [] });
    }

    const query: any = {};
    if (!includeAI) {
      query.isAI = false;
    }

    const leaderboard = await User.find(query)
      .sort({ totalPoints: -1 })
      .limit(limit)
      .select("walletAddress totalPoints totalTrades totalVolume isAI")
      .lean();

    const ranked = leaderboard.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      points: user.totalPoints,
      trades: user.totalTrades,
      volume: user.totalVolume,
      isAI: user.isAI,
    }));

    res.json({ leaderboard: ranked });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.json({ leaderboard: [] });
  }
});

// Start price feed (for chart display without session)
app.post("/price-feed/start", (req: express.Request, res: express.Response) => {
  const userId = req.body.userId || "public";
  
  // Generate historical prices
  const historicalPrices = generateHistoricalPrices(1.0, 24, 1);
  const lastHistoricalPrice = historicalPrices[historicalPrices.length - 1]?.price || 1.0;

  // Start a public price simulator
  const existingSimulator = priceSimulators.get(userId);
  if (existingSimulator) {
    existingSimulator.stop();
  }

  const simulator = new PriceSimulator({
    initialPrice: lastHistoricalPrice,
    volatility: 0.02,
    difficulty: "noob",
    tickInterval: 1000,
  });

  priceSimulators.set(userId, simulator);

  simulator.start((price: number, trend: TrendSignal) => {
    const tick: PriceTick = {
      price,
      timestamp: Date.now(),
      trend,
    };

    // Broadcast to all clients subscribed to this feed
    broadcastPriceUpdate(userId, tick);
  });

  res.json({ 
    success: true, 
    initialPriceHistory: historicalPrices,
    currentPrice: lastHistoricalPrice,
  });
});

// Check token balance endpoint
app.get("/tokens/balance", async (req: express.Request, res: express.Response) => {
  try {
    const address = req.query.address as string;
    if (!address) {
      return res.status(400).json({ error: "address required" });
    }

    const balance = await getTokenBalance(address as Address);
    res.json({
      hasTokens: balance ? parseFloat(balance.balance) > 0 : false,
      balance: balance?.balance || "0",
      address: balance?.address || null,
    });
  } catch (error) {
    console.error("Error checking token balance:", error);
    res.status(500).json({ error: "Failed to check token balance" });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
