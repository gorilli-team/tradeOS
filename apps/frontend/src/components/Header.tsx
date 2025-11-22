"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

interface HeaderProps {
  userPoints?: number;
  userRank?: number;
}

export default function Header({ userPoints = 0, userRank }: HeaderProps) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address || null;

  return (
    <header className="bg-[#0a0e27] border-b border-[#1a1f3a] sticky top-0 z-50">
          <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">tradeOS</h1>
            <div className="h-6 w-px bg-[#1a1f3a]"></div>
            <div className="text-sm text-gray-400">
              Trading Simulator
            </div>
          </div>

          {/* Top Info */}
          <div className="flex items-center gap-6">
            {/* User Points */}
            {authenticated && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Points</div>
                  <div className="text-lg font-bold text-white">{userPoints.toLocaleString()}</div>
                </div>
                {userRank && (
                  <>
                    <div className="h-8 w-px bg-[#1a1f3a]"></div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Rank</div>
                      <div className="text-lg font-bold text-white">#{userRank}</div>
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
                        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
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

