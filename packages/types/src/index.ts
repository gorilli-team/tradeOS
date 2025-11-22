export type TrendSignal = "up" | "down" | "sideways" | "whale" | "rug";

export type DifficultyMode = "noob" | "degen" | "pro";

export interface Portfolio {
  balanceUSD: number;
  balanceToken: number;
  realizedPnl: number;
  entryPrice?: number;
  totalTrades: number;
}

export interface UserState {
  userId: string;
  portfolio: Portfolio;
  level: number;
  xp: number;
  difficulty: DifficultyMode;
  sessionStartTime: number;
}

export interface PriceTick {
  price: number;
  timestamp: number;
  trend: TrendSignal;
  volume?: number;
}

export interface TradeRequest {
  userId: string;
  type: "buy" | "sell" | "panic";
  amount?: number;
}

export interface TradeResponse {
  success: boolean;
  portfolio: Portfolio;
  message?: string;
  error?: string;
}

export interface GameState {
  user: UserState;
  currentPrice: number;
  priceHistory: PriceTick[];
  unrealizedPnl: number;
}

export interface DeviceSignal {
  type: "led" | "alert" | "notification";
  color?: "green" | "red" | "yellow" | "purple" | "orange";
  message?: string;
  level?: number;
}

export interface PriceSimulatorConfig {
  initialPrice: number;
  volatility: number;
  difficulty: DifficultyMode;
  tickInterval: number;
  patterns?: {
    pump?: boolean;
    dump?: boolean;
    rug?: boolean;
    chop?: boolean;
    whale?: boolean;
    parabolic?: boolean;
    slowGrind?: boolean;
  };
}