"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Link from "next/link";
import Header from "../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AIAgent {
  agentId: string;
  name: string;
  ownerAddress: string;
  description?: string;
  strategy?: string;
  walletAddress: string;
  agentUrl?: string;
  isActive: boolean;
  totalPoints: number;
  totalTrades: number;
  totalVolume: number;
}

export default function AgentsPage() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    strategy: "momentum",
    walletAddress: "",
    agentUrl: "",
  });

  const walletAddress = wallets[0]?.address || null;

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch(`${API_URL}/ai-agent/list`);
        const data = await response.json();
        setAgents(data.agents || []);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setError("Failed to load agents");
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    if (!walletAddress) {
      setError("Please connect your wallet first");
      setCreating(false);
      return;
    }

    // Validate wallet address
    const agentWallet = formData.walletAddress.trim();
    if (!agentWallet) {
      setError("Agent wallet address is required");
      setCreating(false);
      return;
    }

    // Basic validation for Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(agentWallet)) {
      setError(
        "Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters)"
      );
      setCreating(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/ai-agent/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          ownerAddress: walletAddress,
          walletAddress: agentWallet,
          description: formData.description || undefined,
          strategy: formData.strategy || undefined,
          agentUrl: formData.agentUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: "",
          description: "",
          strategy: "momentum",
          walletAddress: "",
          agentUrl: "",
        });
        setShowCreateForm(false);
        // Refresh agents list
        const agentsResponse = await fetch(`${API_URL}/ai-agent/list`);
        const agentsData = await agentsResponse.json();
        setAgents(agentsData.agents || []);
      } else {
        setError(data.error || "Failed to create agent");
      }
    } catch (error: any) {
      setError(error.message || "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <Header userPoints={0} />
      <div className="w-full p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Agents</h1>
              <p className="text-gray-400">
                Create and manage your trading agents
              </p>
            </div>
            {authenticated && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                {showCreateForm ? "Cancel" : "+ Create Agent"}
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Create Agent Form */}
          {showCreateForm && authenticated && (
            <div className="mb-6 bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Create New AI Agent
              </h2>
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-[#1a1f3a] border border-[#2a2f4a] text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="My Trading Bot"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-[#1a1f3a] border border-[#2a2f4a] text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Describe your agent's strategy..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">
                    Strategy Type
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) =>
                      setFormData({ ...formData, strategy: e.target.value })
                    }
                    className="w-full bg-[#1a1f3a] border border-[#2a2f4a] text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="momentum">Momentum</option>
                    <option value="mean_reversion">Mean Reversion</option>
                    <option value="rsi">RSI-Based</option>
                    <option value="ml">Machine Learning</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-400">
                    Agent Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.walletAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        walletAddress: e.target.value,
                      })
                    }
                    className="w-full bg-[#1a1f3a] border border-[#2a2f4a] text-white rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="0x..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique Ethereum address for this agent. You can generate one
                    using a wallet or key generation tool.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                >
                  {creating ? "Creating..." : "Create Agent"}
                </button>
              </form>
            </div>
          )}

          {/* Not authenticated message */}
          {!authenticated && (
            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">
                Connect your wallet to create and manage AI agents
              </p>
            </div>
          )}

          {/* Agents List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 text-center">
              <p className="text-gray-400">
                No agents registered yet. Create your first agent to get
                started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.agentId}
                  className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 hover:border-[#2a2f4a] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {agent.name}
                      </h3>
                      {agent.description && (
                        <p className="text-sm text-gray-400 mb-2">
                          {agent.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        agent.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {agent.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Strategy:</span>
                      <span className="text-white capitalize">
                        {agent.strategy || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Points:</span>
                      <span className="text-white font-semibold">
                        {(agent.totalPoints || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Trades:</span>
                      <span className="text-white">
                        {agent.totalTrades || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Volume:</span>
                      <span className="text-white">
                        ${(agent.totalVolume || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1a1f3a]">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <span className="text-gray-400">Owner:</span>{" "}
                        {agent.ownerAddress.slice(0, 6)}...
                        {agent.ownerAddress.slice(-4)}
                      </div>
                      <div>
                        <span className="text-gray-400">Wallet:</span>{" "}
                        {agent.walletAddress.slice(0, 6)}...
                        {agent.walletAddress.slice(-4)}
                      </div>
                      {agent.agentUrl && (
                        <div>
                          <span className="text-gray-400">URL:</span>{" "}
                          <a
                            href={agent.agentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            {agent.agentUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
