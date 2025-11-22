import express from "express";
import { WebSocketServer, WebSocket as WS } from "ws";
import cors from "cors";
import { createServer } from "http";
import { z } from "zod";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// In-memory state (in production, use a database)
const users = new Map<string, UserState>();
const priceSimulators = new Map<string, PriceSimulator>();

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

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
