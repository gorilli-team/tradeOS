#!/usr/bin/env python3
"""
Example AI Agent Server for tradeOS
This agent runs as a web service and connects to tradeOS API via WebSocket
"""

import os
import sys
import time
import json
import asyncio
import logging
from typing import List, Optional, Dict
from collections import deque
from datetime import datetime

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    import uvicorn
except ImportError:
    print("Installing FastAPI and uvicorn...")
    os.system("pip install fastapi uvicorn websockets")
    from fastapi import FastAPI, HTTPException
    from fastapi.responses import JSONResponse
    import uvicorn

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    os.system("pip install websockets")
    import websockets

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system("pip install requests")
    import requests

try:
    import numpy as np
except ImportError:
    print("Installing numpy...")
    os.system("pip install numpy")
    import numpy as np

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:3001")
WS_URL = os.getenv("WS_URL", "ws://localhost:3001")
AGENT_WALLET = os.getenv("AGENT_WALLET", "")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8000"))

# Trading parameters
MIN_PRICE_CHANGE = 0.01  # 1% minimum price change to trigger trade
LOOKBACK_PERIOD = 10
RSI_PERIOD = 14
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="tradeOS AI Agent", version="1.0.0")


class MomentumAgent:
    """Momentum-based trading agent"""

    def __init__(self, wallet_address: str):
        self.wallet_address = wallet_address
        self.price_history: deque = deque(maxlen=100)
        self.is_connected = False
        self.has_tokens = False
        self.session_started = False
        self.last_trade_time = 0
        self.min_trade_interval = 5
        self.stats = {
            "trades_executed": 0,
            "last_trade": None,
            "last_price": None,
        }

    def calculate_rsi(self, prices: List[float], period: int = RSI_PERIOD) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0

        deltas = np.diff(prices[-period - 1 :])
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        avg_gain = np.mean(gains)
        avg_loss = np.mean(losses)

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return float(rsi)

    def calculate_momentum(self, prices: List[float]) -> float:
        """Calculate price momentum"""
        if len(prices) < 2:
            return 0.0

        recent = prices[-LOOKBACK_PERIOD:] if len(prices) >= LOOKBACK_PERIOD else prices
        if len(recent) < 2:
            return 0.0

        return ((recent[-1] - recent[0]) / recent[0]) * 100

    def should_buy(self, current_price: float) -> bool:
        """Determine if agent should buy"""
        if len(self.price_history) < LOOKBACK_PERIOD:
            return False

        prices = list(self.price_history)
        momentum = self.calculate_momentum(prices)
        rsi = self.calculate_rsi(prices)

        if (
            momentum > MIN_PRICE_CHANGE
            and rsi < RSI_OVERBOUGHT
            and (time.time() - self.last_trade_time) > self.min_trade_interval
        ):
            return True

        return False

    def should_sell(self, current_price: float) -> bool:
        """Determine if agent should sell"""
        if len(self.price_history) < LOOKBACK_PERIOD:
            return False

        prices = list(self.price_history)
        momentum = self.calculate_momentum(prices)
        rsi = self.calculate_rsi(prices)

        if (
            momentum < -MIN_PRICE_CHANGE
            and rsi > RSI_OVERSOLD
            and (time.time() - self.last_trade_time) > self.min_trade_interval
        ):
            return True

        return False

    async def execute_trade(self, trade_type: str) -> bool:
        """Execute a trade via the API"""
        try:
            url = f"{API_URL}/trade/{trade_type}"
            response = requests.post(
                url,
                json={"userId": self.wallet_address, "type": trade_type},
                headers={"Content-Type": "application/json"},
                timeout=5,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.last_trade_time = time.time()
                    self.stats["trades_executed"] += 1
                    self.stats["last_trade"] = {
                        "type": trade_type,
                        "timestamp": datetime.now().isoformat(),
                    }
                    logger.info(f"✅ {trade_type.upper()} executed successfully")
                    return True
                else:
                    logger.error(f"❌ {trade_type.upper()} failed: {data.get('error')}")
            else:
                logger.error(f"❌ HTTP {response.status_code}: {response.text}")

            return False
        except Exception as e:
            logger.error(f"❌ Error executing {trade_type}: {e}")
            return False

    async def start_session(self) -> bool:
        """Start a trading session"""
        try:
            url = f"{API_URL}/session/start"
            response = requests.post(
                url,
                json={
                    "userId": self.wallet_address,
                    "difficulty": "pro",
                    "ownerAddress": self.wallet_address,
                },
                headers={"Content-Type": "application/json"},
                timeout=10,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.session_started = True
                    logger.info("✅ Trading session started")
                    return True
                else:
                    logger.error(f"❌ Failed to start session: {data.get('error')}")
            else:
                logger.error(f"❌ HTTP {response.status_code}: {response.text}")

            return False
        except Exception as e:
            logger.error(f"❌ Error starting session: {e}")
            return False

    async def check_token_balance(self) -> bool:
        """Check if agent has tokens"""
        try:
            url = f"{API_URL}/tokens/balance"
            response = requests.get(
                url, params={"address": self.wallet_address}, timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                self.has_tokens = data.get("hasTokens", False)
                return self.has_tokens
            return False
        except Exception as e:
            logger.error(f"❌ Error checking balance: {e}")
            return False

    async def fetch_signals(self) -> Optional[Dict]:
        """Fetch trading signals from API"""
        try:
            url = f"{API_URL}/data/signals"
            response = requests.get(
                url, params={"userId": self.wallet_address}, timeout=5
            )

            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"❌ Error fetching signals: {e}")
            return None

    async def fetch_price_history(self, limit: int = 100) -> List[Dict]:
        """Fetch price history from API"""
        try:
            url = f"{API_URL}/data/price/history"
            response = requests.get(
                url,
                params={"userId": self.wallet_address, "limit": limit},
                timeout=5,
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("history", [])
            return []
        except Exception as e:
            logger.error(f"❌ Error fetching price history: {e}")
            return []

    async def connect_websocket(self):
        """Connect to WebSocket and handle messages"""
        ws_url = WS_URL.replace("http", "ws") if WS_URL.startswith("http") else WS_URL

        while True:
            try:
                logger.info(f"🔌 Connecting to {ws_url}...")
                async with websockets.connect(ws_url) as websocket:
                    self.is_connected = True
                    logger.info("✅ Connected to backend")

                    # Subscribe to price feed
                    subscribe_msg = json.dumps(
                        {"type": "subscribe", "userId": self.wallet_address}
                    )
                    await websocket.send(subscribe_msg)
                    logger.info(f"📡 Subscribed to price feed for {self.wallet_address}")

                    # Listen for messages
                    async for message in websocket:
                        try:
                            data = json.loads(message)

                            if data.get("type") == "price":
                                tick = data.get("data", {})
                                price = tick.get("price")
                                timestamp = tick.get("timestamp")

                                if price:
                                    self.price_history.append(price)
                                    self.stats["last_price"] = price

                                    # Optionally fetch signals from API for more sophisticated decisions
                                    # signals = await self.fetch_signals()
                                    # if signals:
                                    #     # Use API signals for trading decisions
                                    #     pass

                                    # Make trading decision
                                    if self.has_tokens and self.session_started:
                                        if self.should_buy(price):
                                            await self.execute_trade("buy")
                                        elif self.should_sell(price):
                                            await self.execute_trade("sell")

                            elif data.get("type") == "device":
                                # Device signals
                                pass

                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing message: {e}")
                        except Exception as e:
                            logger.error(f"Error processing message: {e}")

            except websockets.exceptions.ConnectionClosed:
                self.is_connected = False
                logger.warning("❌ WebSocket closed. Reconnecting in 3 seconds...")
                await asyncio.sleep(3)
            except Exception as e:
                self.is_connected = False
                logger.error(f"WebSocket error: {e}. Reconnecting in 3 seconds...")
                await asyncio.sleep(3)


# Global agent instance
agent: Optional[MomentumAgent] = None


@app.on_event("startup")
async def startup():
    """Initialize agent on startup"""
    global agent

    if not AGENT_WALLET:
        logger.error("❌ AGENT_WALLET environment variable is required")
        sys.exit(1)

    logger.info("=" * 50)
    logger.info("tradeOS AI Trading Agent Server")
    logger.info("=" * 50)
    logger.info(f"Agent Wallet: {AGENT_WALLET}")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"WS URL: {WS_URL}")
    logger.info("=" * 50)

    agent = MomentumAgent(AGENT_WALLET)

    # Start trading session
    if not await agent.start_session():
        logger.error("❌ Failed to start session")
        return

    # Wait for tokens
    logger.info("⏳ Waiting for tokens...")
    await asyncio.sleep(5)

    # Check token balance
    if not await agent.check_token_balance():
        logger.warning("⚠️  No tokens detected. Agent will wait...")
        while not agent.has_tokens:
            await asyncio.sleep(5)
            await agent.check_token_balance()
        logger.info("✅ Tokens detected!")

    # Start WebSocket connection in background
    asyncio.create_task(agent.connect_websocket())


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "agent_wallet": AGENT_WALLET,
        "connected": agent.is_connected if agent else False,
        "has_tokens": agent.has_tokens if agent else False,
        "session_started": agent.session_started if agent else False,
    }


@app.get("/stats")
async def get_stats():
    """Get agent statistics"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")

    # Optionally fetch signals from tradeOS API
    signals = await agent.fetch_signals() if agent else None

    return {
        "wallet_address": agent.wallet_address,
        "is_connected": agent.is_connected,
        "has_tokens": agent.has_tokens,
        "session_started": agent.session_started,
        "price_history_length": len(agent.price_history),
        "last_price": agent.stats["last_price"],
        "trades_executed": agent.stats["trades_executed"],
        "last_trade": agent.stats["last_trade"],
        "signals": signals,  # Include signals from tradeOS API
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=AGENT_PORT)

