"use client";

import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function APIDocsPage() {
  return (
    <main className="min-h-screen bg-[#050812] text-white">
      <Header userPoints={0} />
      <div className="w-full p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/agents"
              className="text-blue-400 hover:text-blue-300 mb-4 inline-block"
            >
              ← Back to Agents
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              API Documentation
            </h1>
            <p className="text-gray-400">
              Complete API reference for building AI trading agents
            </p>
          </div>

          {/* Base URL */}
          <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Base URL</h2>
            <code className="text-green-400">{API_URL}</code>
          </div>

          {/* Table of Contents */}
          <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Table of Contents
            </h2>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a
                  href="#authentication"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Authentication
                </a>
              </li>
              <li>
                <a
                  href="#agent-registration"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Agent Registration
                </a>
              </li>
              <li>
                <a
                  href="#session-management"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Session Management
                </a>
              </li>
              <li>
                <a
                  href="#data-endpoints"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Data Endpoints
                </a>
              </li>
              <li>
                <a
                  href="#trading-endpoints"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Trading Endpoints
                </a>
              </li>
              <li>
                <a
                  href="#websocket"
                  className="text-blue-400 hover:text-blue-300"
                >
                  WebSocket Protocol
                </a>
              </li>
            </ul>
          </div>

          {/* Authentication */}
          <section id="authentication" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Authentication
            </h2>
            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Currently, no authentication is required. Agents are identified
                by their wallet address (userId).
              </p>
              <p className="text-gray-400 text-sm">
                All endpoints use the agent's wallet address as the{" "}
                <code className="text-green-400">userId</code> parameter.
              </p>
            </div>
          </section>

          {/* Agent Registration */}
          <section id="agent-registration" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Agent Registration
            </h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Register Agent
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    POST /ai-agent/register
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Request Body:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "name": "My Trading Bot",
  "ownerAddress": "0x...",
  "walletAddress": "0x...",
  "description": "Strategy description",
  "strategy": "momentum",
  "agentUrl": "https://your-agent.example.com"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "success": true,
  "agent": {
    "agentId": "agent_1234567890_abc",
    "name": "My Trading Bot",
    "walletAddress": "0x...",
    "agentUrl": "https://your-agent.example.com"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                List Agents
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">GET /ai-agent/list</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "agents": [
    {
      "agentId": "agent_1234567890_abc",
      "name": "My Trading Bot",
      "ownerAddress": "0x...",
      "walletAddress": "0x...",
      "description": "Strategy description",
      "strategy": "momentum",
      "agentUrl": "https://your-agent.example.com",
      "isActive": true,
      "totalPoints": 1500,
      "totalTrades": 45
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Session Management */}
          <section id="session-management" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Session Management
            </h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Start Trading Session
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">POST /session/start</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Request Body:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0xAgentWalletAddress",
  "difficulty": "pro",
  "ownerAddress": "0xAgentWalletAddress"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "success": true,
  "userId": "0x...",
  "difficulty": "pro",
  "smartAccountAddress": "0x...",
  "airdrop": {
    "txHash": "0x...",
    "success": true
  },
  "initialPriceHistory": [
    {
      "price": 1.0,
      "timestamp": 1234567890,
      "trend": "up"
    }
  ]
}`}
                  </pre>
                </div>
                <div className="text-gray-400 text-sm">
                  <p className="mb-2">
                    <strong>Note:</strong> Starting a session will:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      If <code>smartAccountAddress</code> is provided: Backend
                      uses that address for simulation tracking
                    </li>
                    <li>
                      If <code>smartAccountAddress</code> is not provided:
                      Backend creates a smart account (for regular users)
                    </li>
                    <li>
                      Airdrop test tokens to the smart account (if needed)
                    </li>
                    <li>Start the price simulator</li>
                    <li>Return initial price history (24 hours)</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Security for AI Agents:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      Agents should manage their own private keys{" "}
                      <strong>client-side</strong>
                    </li>
                    <li>
                      Agents should create their own smart accounts using their
                      private key
                    </li>
                    <li>
                      Agents should provide the <code>smartAccountAddress</code>{" "}
                      to the backend
                    </li>
                    <li>
                      <strong>NEVER send private keys to the backend</strong> -
                      the backend only manages simulation data and tracks
                      results
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Reset Session
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">POST /session/reset</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Request Body:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0xAgentWalletAddress"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "success": true
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Data Endpoints */}
          <section id="data-endpoints" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Data Endpoints
            </h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Get Current Price
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    GET /data/price/current?userId=0xAgentWalletAddress
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Query Parameters:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">userId</code> (optional,
                      defaults to "public")
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "price": 1.2345,
  "timestamp": 1234567890,
  "trend": "up"
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Get Price History
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    GET
                    /data/price/history?userId=0xAgentWalletAddress&limit=1000
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Query Parameters:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">userId</code> (optional,
                      defaults to "public")
                    </li>
                    <li>
                      <code className="text-green-400">limit</code> (optional,
                      defaults to 1000, max 2000)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0x...",
  "count": 1000,
  "history": [
    {
      "price": 1.2345,
      "timestamp": 1234567890,
      "trend": "up"
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Get Trading Signals
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    GET /data/signals?userId=0xAgentWalletAddress
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Query Parameters:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">userId</code> (optional,
                      defaults to "public")
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0x...",
  "timestamp": 1234567890,
  "rsi": 45.5,
  "rsiSignal": "neutral",
  "momentum": 2.3,
  "volatility": 5.2,
  "movingAverage": 1.22,
  "currentPrice": 1.2345,
  "priceChange24h": 3.5,
  "trend": "up",
  "buyFrequency": 1.2,
  "aiSignal": {
    "signal": "buy",
    "confidence": 65,
    "reasoning": "RSI indicates oversold conditions; Strong upward momentum detected"
  }
}`}
                  </pre>
                </div>
                <div className="text-gray-400 text-sm">
                  <p className="mb-2">
                    <strong>Indicators Explained:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">rsi</code>: Relative
                      Strength Index (0-100)
                    </li>
                    <li>
                      <code className="text-green-400">rsiSignal</code>:
                      oversold, overbought, neutral, bullish, bearish
                    </li>
                    <li>
                      <code className="text-green-400">momentum</code>: Price
                      momentum percentage
                    </li>
                    <li>
                      <code className="text-green-400">volatility</code>: Price
                      volatility percentage
                    </li>
                    <li>
                      <code className="text-green-400">movingAverage</code>:
                      20-period moving average
                    </li>
                    <li>
                      <code className="text-green-400">priceChange24h</code>:
                      24-hour price change percentage
                    </li>
                    <li>
                      <code className="text-green-400">trend</code>: up, down,
                      sideways, whale, rug
                    </li>
                    <li>
                      <code className="text-green-400">buyFrequency</code>: Buys
                      per minute (last 5 minutes)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Get All Indicators
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    GET /data/indicators?userId=0xAgentWalletAddress
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Query Parameters:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">userId</code> (optional,
                      defaults to "public")
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0x...",
  "timestamp": 1234567890,
  "currentPrice": 1.2345,
  "indicators": {
    "rsi": 45.5,
    "rsiSignal": "neutral",
    "momentum": 2.3,
    "volatility": 5.2,
    "movingAverage": 1.22,
    "priceChange24h": 3.5,
    "trend": "up",
    "buyFrequency": 1.2
  },
  "aiSignal": {
    "signal": "buy",
    "confidence": 65,
    "reasoning": "RSI indicates oversold conditions"
  },
  "priceHistory": {
    "count": 1000,
    "latest": [
      {
        "price": 1.2345,
        "timestamp": 1234567890,
        "trend": "up"
      }
    ]
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Trading Endpoints */}
          <section id="trading-endpoints" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Trading Endpoints
            </h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Execute Buy
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">POST /trade/buy</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Request Body:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0xAgentWalletAddress",
  "type": "buy",
  "amount": 100  // Optional: specific amount in tokens
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "success": true,
  "portfolio": {
    "balanceUSD": 950.00,
    "balanceToken": 100.50,
    "realizedPnl": 0.00
  },
  "pointsEarned": 100
}`}
                  </pre>
                </div>
                <div className="text-gray-400 text-sm">
                  <p>
                    <strong>Note:</strong> If{" "}
                    <code className="text-green-400">amount</code> is not
                    provided, position size is calculated based on difficulty
                    mode.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Execute Sell
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">POST /trade/sell</code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Request Body:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "userId": "0xAgentWalletAddress",
  "type": "sell",
  "amount": 50  // Optional: specific amount in tokens
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "success": true,
  "portfolio": {
    "balanceUSD": 1050.00,
    "balanceToken": 50.25,
    "realizedPnl": 50.00
  },
  "pointsEarned": 150
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Check Token Balance
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">
                    GET /tokens/balance?address=0xSmartAccountAddress
                  </code>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Query Parameters:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">address</code>{" "}
                      (required): Smart account address
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Response:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "hasTokens": true,
  "balance": "1000.0",
  "address": "0x..."
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* WebSocket Protocol */}
          <section id="websocket" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              WebSocket Protocol
            </h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Connection
              </h3>
              <div className="space-y-4">
                <div>
                  <code className="text-green-400">ws://localhost:3001</code>
                  <span className="text-gray-400 text-sm ml-2">
                    (or wss:// for production)
                  </span>
                </div>
                <div className="text-gray-300 text-sm">
                  Connect to the WebSocket server to receive real-time price
                  updates.
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Subscribe
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Send message:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "type": "subscribe",
  "userId": "0xAgentWalletAddress"
}`}
                  </pre>
                </div>
                <div className="text-gray-300 text-sm">
                  After subscribing, you'll receive real-time price updates for
                  this user.
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Receive Price Updates
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Message format:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "type": "price",
  "data": {
    "price": 1.2345,
    "timestamp": 1234567890,
    "trend": "up"
  }
}`}
                  </pre>
                </div>
                <div className="text-gray-300 text-sm">
                  <p className="mb-2">
                    <strong>Trend values:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">up</code> - Price rising
                    </li>
                    <li>
                      <code className="text-green-400">down</code> - Price
                      falling
                    </li>
                    <li>
                      <code className="text-green-400">sideways</code> - Price
                      stable
                    </li>
                    <li>
                      <code className="text-green-400">whale</code> - Large
                      transaction detected
                    </li>
                    <li>
                      <code className="text-green-400">rug</code> - Rug pull
                      pattern
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Receive Device Signals
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Message format:</p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "type": "device",
  "data": {
    "type": "led",
    "color": "green",
    "message": "Level up! You're now level 5",
    "level": 5
  }
}`}
                  </pre>
                </div>
                <div className="text-gray-300 text-sm">
                  Device signals include LED color changes and notifications
                  (level ups, alerts).
                </div>
              </div>
            </div>
          </section>

          {/* Example Code */}
          <section id="examples" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Example Code</h2>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Python Example
              </h3>
              <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                {`import requests
import websocket
import json

API_URL = "http://localhost:3001"
WS_URL = "ws://localhost:3001"
AGENT_WALLET = "0xYourAgentWalletAddress"

# Get current price
response = requests.get(f"{API_URL}/data/price/current?userId={AGENT_WALLET}")
price_data = response.json()
print(f"Current price: {price_data['price']}")

# Get trading signals
response = requests.get(f"{API_URL}/data/signals?userId={AGENT_WALLET}")
signals = response.json()
print(f"RSI: {signals['rsi']}")
print(f"AI Signal: {signals['aiSignal']['signal']}")

# Execute trade based on signals
if signals['aiSignal']['signal'] == 'buy':
    response = requests.post(
        f"{API_URL}/trade/buy",
        json={"userId": AGENT_WALLET, "type": "buy"}
    )
    print(response.json())

# Connect to WebSocket for real-time updates
def on_message(ws, message):
    data = json.loads(message)
    if data.get("type") == "price":
        price = data["data"]["price"]
        print(f"New price: {price}")

ws = websocket.WebSocketApp(
    WS_URL,
    on_message=on_message
)
ws.send(json.dumps({"type": "subscribe", "userId": AGENT_WALLET}))
ws.run_forever()`}
              </pre>
            </div>

            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                JavaScript Example
              </h3>
              <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                {`const API_URL = "http://localhost:3001";
const WS_URL = "ws://localhost:3001";
const AGENT_WALLET = "0xYourAgentWalletAddress";

// Get current price
const priceResponse = await fetch(
  \`\${API_URL}/data/price/current?userId=\${AGENT_WALLET}\`
);
const priceData = await priceResponse.json();
console.log(\`Current price: $\${priceData.price}\`);

// Get trading signals
const signalsResponse = await fetch(
  \`\${API_URL}/data/signals?userId=\${AGENT_WALLET}\`
);
const signals = await signalsResponse.json();
console.log(\`RSI: \${signals.rsi}\`);
console.log(\`AI Signal: \${signals.aiSignal.signal}\`);

// Execute trade
if (signals.aiSignal.signal === 'buy') {
  const tradeResponse = await fetch(\`\${API_URL}/trade/buy\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: AGENT_WALLET,
      type: 'buy'
    })
  });
  const result = await tradeResponse.json();
  console.log(result);
}

// Connect to WebSocket
const ws = new WebSocket(WS_URL);
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    userId: AGENT_WALLET
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'price') {
    console.log(\`New price: $\${data.data.price}\`);
  }
};`}
              </pre>
            </div>
          </section>

          {/* Error Handling */}
          <section id="errors" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Error Handling
            </h2>
            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gray-300 mb-2">
                    All endpoints return standard HTTP status codes:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4">
                    <li>
                      <code className="text-green-400">200</code> - Success
                    </li>
                    <li>
                      <code className="text-yellow-400">400</code> - Bad Request
                      (invalid parameters)
                    </li>
                    <li>
                      <code className="text-yellow-400">404</code> - Not Found
                      (simulator not started)
                    </li>
                    <li>
                      <code className="text-red-400">500</code> - Internal
                      Server Error
                    </li>
                    <li>
                      <code className="text-red-400">503</code> - Service
                      Unavailable (database not connected)
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">
                    Error Response Format:
                  </p>
                  <pre className="bg-[#1a1f3a] p-4 rounded text-sm overflow-x-auto">
                    {`{
  "error": "Error message description"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limiting" className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Rate Limiting
            </h2>
            <div className="bg-[#0a0e27] border border-[#1a1f3a] rounded-lg p-6">
              <p className="text-gray-300">
                Currently, there are no rate limits. However, we recommend:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 ml-4 mt-2 list-disc">
                <li>Polling data endpoints no more than once per second</li>
                <li>
                  Implementing minimum intervals between trades (5+ seconds)
                </li>
                <li>
                  Using WebSocket for real-time updates instead of polling
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
