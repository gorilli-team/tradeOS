"use client";

import { useState, useEffect, useRef } from "react";
import {
  GameState,
  PriceTick,
  DifficultyMode,
  DeviceSignal,
} from "@tradeOS/types";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  calculateRSI,
  getRSISignal,
  calculateBuyFrequency,
  generateAISignal,
} from "../utils/indicators";
import TradingViewChart from "../components/TradingViewChart";
import Header from "../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceTick[]>([]);
  const [deviceSignal, setDeviceSignal] = useState<DeviceSignal | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyMode>("noob");
  const [isConnected, setIsConnected] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(
    null
  );
  const [airdropTxHash, setAirdropTxHash] = useState<string | null>(null);
  const [buyTimestamps, setBuyTimestamps] = useState<number[]>([]);
  const [hasTokens, setHasTokens] = useState<boolean>(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | undefined>(undefined);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || null;

  // Start price feed immediately on mount
  useEffect(() => {
    const startPriceFeed = async () => {
      try {
        const response = await fetch(`${API_URL}/price-feed/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "public" }),
        });
        const result = await response.json();

        if (result.initialPriceHistory) {
          setPriceHistory(result.initialPriceHistory);
        }

        // Connect to public price feed WebSocket
        const wsUrl = API_URL.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsUrl}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: "subscribe", userId: "public" }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === "price") {
            const tick: PriceTick = message.data;
            setPriceHistory((prev) => {
              const newHistory = [...prev, tick];
              return newHistory.slice(-2000);
            });
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => setIsConnected(false);
      } catch (error) {
        console.error("Error starting price feed:", error);
      }
    };

    startPriceFeed();
  }, []);

  // Check token balance when wallet is connected
  useEffect(() => {
    const checkTokenBalance = async () => {
      if (!walletAddress || !smartAccountAddress) {
        setHasTokens(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/tokens/balance?address=${smartAccountAddress}`
        );
        const result = await response.json();
        setHasTokens(result.hasTokens || false);
      } catch (error) {
        console.error("Error checking token balance:", error);
        setHasTokens(false);
      }
    };

    checkTokenBalance();
    // Check every 10 seconds
    const interval = setInterval(checkTokenBalance, 10000);
    return () => clearInterval(interval);
  }, [walletAddress, smartAccountAddress]);

  // Fetch user points and rank
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!walletAddress) return;

      try {
        const [pointsRes, leaderboardRes] = await Promise.all([
          fetch(`${API_URL}/user/points?walletAddress=${walletAddress}`),
          fetch(`${API_URL}/leaderboard?limit=100`),
        ]);

        const pointsData = await pointsRes.json();
        const leaderboardData = await leaderboardRes.json();

        setUserPoints(pointsData.points || 0);

        // Find user rank
        const rank = leaderboardData.leaderboard?.findIndex(
          (entry: any) => entry.walletAddress === walletAddress
        );
        if (rank !== undefined && rank !== -1) {
          setUserRank(rank + 1);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };

    fetchUserStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUserStats, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const startSession = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      // Start session with smart account creation and airdrop
      const response = await fetch(`${API_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: walletAddress,
          difficulty,
          ownerAddress: walletAddress, // Send owner address for smart account creation
        }),
      });

      const result = await response.json();

      if (result.smartAccountAddress) {
        setSmartAccountAddress(result.smartAccountAddress);
      }

      if (result.airdrop?.txHash) {
        setAirdropTxHash(result.airdrop.txHash);
        console.log(`Airdrop transaction: ${result.airdrop.txHash}`);
      }

      if (result.airdrop && !result.airdrop.success) {
        console.warn("Airdrop failed:", result.airdrop.error);
      }

      // Load initial price history if provided
      if (
        result.initialPriceHistory &&
        Array.isArray(result.initialPriceHistory)
      ) {
        setPriceHistory(result.initialPriceHistory);
      }

      // Connect WebSocket
      const ws = new WebSocket(`ws://localhost:3001`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: "subscribe", userId: walletAddress }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "price") {
          const tick: PriceTick = message.data;
          setPriceHistory((prev) => {
            const newHistory = [...prev, tick];
            // Keep last 2000 ticks (for 24h+ of data)
            return newHistory.slice(-2000);
          });
        } else if (message.type === "device") {
          setDeviceSignal(message.data);
        }
      };

      ws.onerror = () => setIsConnected(false);
      ws.onclose = () => setIsConnected(false);

      setIsSessionStarted(true);
      // Fetch initial state
      fetchState();
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Failed to start session");
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Periodically fetch state when session is active
  useEffect(() => {
    if (!isSessionStarted || !walletAddress) return;

    const interval = setInterval(() => {
      fetchState();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isSessionStarted, walletAddress]);

  const fetchState = async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(`${API_URL}/state?userId=${walletAddress}`);
      const state: GameState = await response.json();
      setGameState(state);
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  };

  const handleTrade = async (type: "buy" | "sell" | "panic") => {
    if (!walletAddress || !isSessionStarted) {
      alert("Please connect wallet and start session first");
      return;
    }
    try {
      const endpoint = type === "panic" ? "/trade/sell" : `/trade/${type}`;
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: walletAddress, type }),
      });
      const result = await response.json();
      if (result.success) {
        // Track buy timestamps for frequency calculation
        if (type === "buy") {
          setBuyTimestamps((prev) => [...prev, Date.now()]);
        }
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
    if (!walletAddress) return;
    try {
      await fetch(`${API_URL}/session/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: walletAddress }),
      });
      setPriceHistory([]);
      setDeviceSignal(null);
      setIsSessionStarted(false);
      setSmartAccountAddress(null);
      setAirdropTxHash(null);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
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

  // Calculate indicators
  const prices = priceHistory.map((t) => t.price);
  const rsi = calculateRSI(prices);
  const rsiSignal = getRSISignal(rsi);
  const buyFrequency = calculateBuyFrequency(buyTimestamps);
  const currentPrice =
    gameState?.currentPrice || prices[prices.length - 1] || 0;
  const aiSignal = generateAISignal(
    priceHistory,
    rsi,
    buyFrequency,
    currentPrice
  );

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <Header
        userPoints={userPoints}
        userRank={userRank}
        isConnected={isConnected}
        isSessionStarted={isSessionStarted}
        deviceSignal={deviceSignal}
      />
      <div className="w-full p-4">
        {/* Always show chart - trading requires tokens */}
        {priceHistory.length > 0 ? (
          <div className="space-y-3">
            {/* Main Trading Area: Chart and Signals on Left, Buy/Sell on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Left Side: Chart and Signals - Takes 3 columns */}
              <div className="lg:col-span-3 space-y-3">
                {/* TradingView Chart */}
                <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-1">
                        Price Chart
                      </h2>
                      <p className="text-2xl font-bold text-white">
                        $
                        {prices.length > 0
                          ? prices[prices.length - 1].toFixed(4)
                          : "0.0000"}
                      </p>
                    </div>
                    <div className="text-right">
                      {gameState && (
                        <div className="text-sm">
                          <p
                            className={`font-semibold ${
                              gameState.unrealizedPnl >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {gameState.unrealizedPnl >= 0 ? "+" : ""}$
                            {gameState.unrealizedPnl.toFixed(2)}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Unrealized PnL
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {priceHistory.length > 0 && (
                    <TradingViewChart data={priceHistory} height={300} />
                  )}
                  {gameState && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-gray-400">Trend: </span>
                          <span className="text-white font-semibold">
                            {priceHistory[
                              priceHistory.length - 1
                            ]?.trend?.toUpperCase() || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">24h Change: </span>
                          <span
                            className={`font-semibold ${
                              prices.length > 1 &&
                              prices[prices.length - 1] > prices[0]
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {prices.length > 1
                              ? (
                                  ((prices[prices.length - 1] - prices[0]) /
                                    prices[0]) *
                                  100
                                ).toFixed(2)
                              : "0.00"}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trading Signals Panel - Below Chart on Left */}
                <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Trading Signals
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* RSI Indicator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">RSI (14)</span>
                        <span
                          className={`text-sm font-semibold ${rsiSignal.color}`}
                        >
                          {rsi.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-[#1a1f3a] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            rsi < 30
                              ? "bg-green-400"
                              : rsi > 70
                              ? "bg-red-400"
                              : "bg-blue-400"
                          }`}
                          style={{ width: `${rsi}%` }}
                        ></div>
                      </div>
                      <p className={`text-xs mt-1 ${rsiSignal.color}`}>
                        {rsiSignal.label}
                      </p>
                    </div>

                    {/* Buy Frequency */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                          Buy Frequency
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {buyFrequency.toFixed(2)}/min
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last 5 minutes
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Total Buys: {buyTimestamps.length}
                      </div>
                    </div>

                    {/* AI Signal */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">AI Signal</span>
                        <span
                          className={`text-sm font-semibold ${aiSignal.color}`}
                        >
                          {aiSignal.signal.toUpperCase().replace("_", " ")}
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Confidence</span>
                          <span className="text-white">
                            {aiSignal.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1a1f3a] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              aiSignal.confidence >= 70
                                ? "bg-green-400"
                                : aiSignal.confidence >= 50
                                ? "bg-blue-400"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${aiSignal.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {aiSignal.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buy/Sell Buttons - Takes 1 column */}
              <div className="space-y-4">
                {/* Session Start - Show when wallet connected but session not started */}
                {authenticated && !isSessionStarted && (
                  <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">
                      Get Started
                    </h2>
                    <div className="space-y-3">
                      {smartAccountAddress && (
                        <div className="text-xs text-gray-500 mb-2">
                          Smart Account: {smartAccountAddress.slice(0, 6)}...
                          {smartAccountAddress.slice(-4)}
                        </div>
                      )}
                      {airdropTxHash && (
                        <div className="text-xs mb-2">
                          <a
                            href={`https://sepolia.etherscan.io/tx/${airdropTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            View Airdrop TX
                          </a>
                        </div>
                      )}
                      {!hasTokens && (
                        <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded p-2">
                          ⚠️ No tokens detected. Start a session to receive test
                          tokens.
                        </div>
                      )}
                      <button
                        onClick={startSession}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                      >
                        Start Trading Session
                      </button>
                    </div>
                  </div>
                )}

                {/* Trading Buttons - Show when session is started */}
                {isSessionStarted && (
                  <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-3 text-white">
                      Trading
                    </h2>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleTrade("buy")}
                        disabled={!hasTokens || !isSessionStarted}
                        className={`w-full font-bold py-4 px-4 rounded border transition-colors text-lg ${
                          hasTokens && isSessionStarted
                            ? "bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed"
                        }`}
                      >
                        {!hasTokens ? "NO TOKENS" : "BUY"}
                      </button>
                      <button
                        onClick={() => handleTrade("sell")}
                        disabled={!hasTokens || !isSessionStarted}
                        className={`w-full font-bold py-4 px-4 rounded border transition-colors text-lg ${
                          hasTokens && isSessionStarted
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                            : "bg-gray-500/20 text-gray-500 border-gray-500/30 cursor-not-allowed"
                        }`}
                      >
                        {!hasTokens ? "NO TOKENS" : "SELL"}
                      </button>
                      <button
                        onClick={() => handleTrade("panic")}
                        className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold py-3 px-4 rounded border border-orange-500/30 transition-colors"
                      >
                        PANIC EXIT
                      </button>
                    </div>
                  </div>
                )}

                {/* Portfolio Summary */}
                {gameState && (
                  <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-3 text-white">
                      Portfolio
                    </h2>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-xs">USD Balance</p>
                        <p className="text-xl font-bold text-white">
                          ${gameState.user.portfolio.balanceUSD.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Token Balance</p>
                        <p className="text-xl font-bold text-white">
                          {gameState.user.portfolio.balanceToken.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Realized PnL</p>
                        <p
                          className={`text-lg font-bold ${
                            gameState.user.portfolio.realizedPnl >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          ${gameState.user.portfolio.realizedPnl.toFixed(2)}
                        </p>
                      </div>
                      {/* Level & XP */}
                      <div className="pt-2 border-t border-[#1a1f3a]">
                        <p className="text-gray-400 text-xs mb-1">
                          Level {gameState.user.level}
                        </p>
                        <div className="w-full bg-[#1a1f3a] rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${
                                ((gameState.user.xp % 100) / 100) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          XP: {gameState.user.xp}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Submenu */}
                <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-4">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h2 className="text-lg font-semibold text-white">
                      Settings
                    </h2>
                    <span className="text-gray-400 text-sm">
                      {showSettings ? "▼" : "▶"}
                    </span>
                  </button>
                  {showSettings && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-[#1a1f3a]">
                      <div>
                        <label className="block text-xs font-medium mb-2 text-gray-400">
                          Difficulty
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) =>
                            setDifficulty(e.target.value as DifficultyMode)
                          }
                          className="w-full bg-[#1a1f3a] border border-[#2a2f4a] text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="noob">Noob</option>
                          <option value="degen">DeGen</option>
                          <option value="pro">Pro</option>
                        </select>
                      </div>
                      <button
                        onClick={handleReset}
                        className="w-full bg-[#1a1f3a] hover:bg-[#2a2f4a] text-white font-medium py-2 px-4 rounded border border-[#2a2f4a] transition-colors text-sm"
                      >
                        Reset Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">Loading price data...</p>
          </div>
        )}
      </div>
    </main>
  );
}
