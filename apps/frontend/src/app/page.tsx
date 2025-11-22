"use client";

import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  GameState,
  PriceTick,
  DifficultyMode,
  DeviceSignal,
} from "@tradeOS/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [userId] = useState("default");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);
  const [deviceSignal, setDeviceSignal] = useState<DeviceSignal | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyMode>("noob");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Start session
    fetch(`${API_URL}/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, difficulty }),
    }).then(() => {
      // Connect WebSocket
      const ws = new WebSocket(`ws://localhost:3001`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: "subscribe", userId }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "price") {
          const tick: PriceTick = message.data;
          setPriceHistory((prev) => {
            const newHistory = [...prev, tick];
            // Keep last 100 ticks
            return newHistory.slice(-100);
          });
        } else if (message.type === "device") {
          setDeviceSignal(message.data);
        }
      };

      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => setIsConnected(false);

      // Fetch initial state
      fetchState();
    });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, difficulty]);

  const fetchState = async () => {
    try {
      const response = await fetch(`${API_URL}/state?userId=${userId}`);
      const state: GameState = await response.json();
      setGameState(state);
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  };

  const handleTrade = async (type: "buy" | "sell" | "panic") => {
    try {
      const endpoint = type === "panic" ? "/trade/sell" : `/trade/${type}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type }),
      });
      const result = await response.json();
      if (result.success) {
        fetchState();
      } else {
        alert(result.error || "Trade failed");
      }
    } catch (error) {
      console.error("Error executing trade:", error);
      alert("Trade failed");
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/session/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setPriceHistory([]);
      setDeviceSignal(null);
      fetchState();
    } catch (error) {
      console.error("Error resetting session:", error);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "bg-trend-up";
      case "down":
        return "bg-trend-down";
      case "sideways":
        return "bg-trend-sideways";
      case "whale":
        return "bg-trend-whale";
      case "rug":
        return "bg-trend-rug";
      default:
        return "bg-gray-500";
    }
  };

  const chartData = priceHistory.map((tick) => ({
    time: new Date(tick.timestamp).toLocaleTimeString(),
    price: tick.price,
  }));

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">🚀 MemeTrainer</h1>

        {/* Connection Status */}
        <div className="mb-4 text-center">
          <span
            className={`px-4 py-2 rounded ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>

        {/* Device Signal Indicator */}
        {deviceSignal && (
          <div className="mb-4 text-center">
            <div
              className={`inline-block px-6 py-3 rounded-lg ${
                deviceSignal.color
                  ? getTrendColor(deviceSignal.color)
                  : "bg-gray-600"
              }`}
            >
              {deviceSignal.message ||
                `LED: ${deviceSignal.color?.toUpperCase()}`}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Price Chart */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Price Chart</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            {gameState && (
              <div className="mt-4 text-center">
                <p className="text-3xl font-bold">
                  ${gameState.currentPrice.toFixed(4)}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Trend: {priceHistory[priceHistory.length - 1]?.trend || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* Portfolio & Controls */}
          <div className="space-y-6">
            {/* Trading Controls - Moved to top */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Trading</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleTrade("buy")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                >
                  BUY
                </button>
                <button
                  onClick={() => handleTrade("sell")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded"
                >
                  SELL
                </button>
                <button
                  onClick={() => handleTrade("panic")}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded"
                >
                  PANIC EXIT
                </button>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Portfolio</h2>
              {gameState ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400">USD Balance</p>
                    <p className="text-2xl font-bold">
                      ${gameState.user.portfolio.balanceUSD.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Token Balance</p>
                    <p className="text-2xl font-bold">
                      {gameState.user.portfolio.balanceToken.toFixed(4)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Realized PnL</p>
                    <p
                      className={`text-2xl font-bold ${
                        gameState.user.portfolio.realizedPnl >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      ${gameState.user.portfolio.realizedPnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Unrealized PnL</p>
                    <p
                      className={`text-2xl font-bold ${
                        gameState.unrealizedPnl >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      ${gameState.unrealizedPnl.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p>Loading...</p>
              )}
            </div>

            {/* Level & XP */}
            {gameState && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Level {gameState.user.level}
                </h2>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{
                      width: `${((gameState.user.xp % 100) / 100) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  XP: {gameState.user.xp}
                </p>
              </div>
            )}

            {/* Settings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Settings</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as DifficultyMode)
                    }
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  >
                    <option value="noob">Noob</option>
                    <option value="degen">DeGen</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Reset Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
