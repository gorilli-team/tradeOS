"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { DeviceSignal } from "@tradeOS/types";

interface HeaderProps {
  userPoints?: number;
  userRank?: number;
  isConnected?: boolean;
  isSessionStarted?: boolean;
  deviceSignal?: DeviceSignal | null;
}

const getTrendColor = (color: string) => {
  switch (color?.toLowerCase()) {
    case "green":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "red":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "yellow":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "purple":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "orange":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

export default function Header({
  userPoints = 0,
  userRank,
  isConnected = false,
  isSessionStarted = false,
  deviceSignal = null,
}: HeaderProps) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address || null;

  return (
    <header className="bg-[#0a0e27] border-b border-[#1a1f3a] sticky top-0 z-50">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-2xl font-bold text-white hover:text-green-400 transition-colors"
            >
              tradeOS
            </a>
            <div className="h-6 w-px bg-[#1a1f3a]"></div>
            <div className="text-sm text-gray-400">Trading Simulator</div>
            <div className="h-6 w-px bg-[#1a1f3a]"></div>
            <a
              href="/agents"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              AI Agents
            </a>
          </div>

          {/* Top Info */}
          <div className="flex items-center gap-6">
            {/* Connection Status */}
            {isSessionStarted && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded text-xs font-medium border ${
                    isConnected
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {isConnected ? "● Connected" : "● Disconnected"}
                </span>
              </div>
            )}

            {/* Device Signal Indicator */}
            {deviceSignal && (
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded text-xs font-medium border ${
                    deviceSignal.color
                      ? getTrendColor(deviceSignal.color)
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}
                >
                  {deviceSignal.message ||
                    `LED: ${deviceSignal.color?.toUpperCase()}`}
                </div>
              </div>
            )}

            {/* User Points */}
            {authenticated && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Points</div>
                  <div className="text-lg font-bold text-white">
                    {userPoints.toLocaleString()}
                  </div>
                </div>
                {userRank && (
                  <>
                    <div className="h-8 w-px bg-[#1a1f3a]"></div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Rank</div>
                      <div className="text-lg font-bold text-white">
                        #{userRank}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Wallet Management */}
            <div className="flex items-center gap-3">
              {!ready ? (
                <div className="text-gray-400 text-sm">Loading...</div>
              ) : !authenticated ? (
                <button
                  onClick={login}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Wallet</div>
                    <div className="text-sm font-medium text-white">
                      {walletAddress
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(
                            -4
                          )}`
                        : "Not connected"}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs bg-[#1a1f3a] hover:bg-[#2a2f4a] text-gray-300 rounded border border-[#2a2f4a] transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
