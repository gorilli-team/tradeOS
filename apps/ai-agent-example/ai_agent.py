#!/usr/bin/env python3
"""
Example AI Trading Agent for tradeOS
This agent implements a simple momentum-based trading strategy
"""

import os
import sys
import time
import json
import requests
from typing import List, Optional, Dict
from collections import deque

try:
    import websocket
except ImportError:
    print("Installing websocket-client...")
    os.system("pip install websocket-client")
    import websocket

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

# Trading parameters
MIN_PRICE_CHANGE = 0.01  # 1% minimum price change to trigger trade
LOOKBACK_PERIOD = 10  # Number of price points to consider
RSI_PERIOD = 14
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 70


class MomentumAgent:
    """Simple momentum-based trading agent"""

    def __init__(self, wallet_address: str):
        self.wallet_address = wallet_address
        self.price_history: deque = deque(maxlen=100)
        self.is_connected = False
        self.has_tokens = False
        self.session_started = False
        self.last_trade_time = 0
        self.min_trade_interval = 5  # Minimum seconds between trades

    def calculate_rsi(self, prices: List[float], period: int = RSI_PERIOD) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50.0  # Neutral RSI

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
        """Calculate price momentum (rate of change)"""
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

        # Buy conditions:
        # 1. Positive momentum (price rising)
        # 2. RSI not overbought
        # 3. Minimum time since last trade
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

        # Sell conditions:
        # 1. Negative momentum (price falling)
        # 2. RSI not oversold (take profit)
        # 3. Minimum time since last trade
        if (
            momentum < -MIN_PRICE_CHANGE
            and rsi > RSI_OVERSOLD
            and (time.time() - self.last_trade_time) > self.min_trade_interval
        ):
            return True

        return False

    def execute_trade(self, trade_type: str) -> bool:
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
                    print(f"✅ {trade_type.upper()} executed successfully")
                    return True
                else:
                    print(f"❌ {trade_type.upper()} failed: {data.get('error')}")
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")

            return False
        except Exception as e:
            print(f"❌ Error executing {trade_type}: {e}")
            return False

    def start_session(self) -> bool:
        """Start a trading session for the agent"""
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
                    print("✅ Trading session started")
                    return True
                else:
                    print(f"❌ Failed to start session: {data.get('error')}")
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")

            return False
        except Exception as e:
            print(f"❌ Error starting session: {e}")
            return False

    def check_token_balance(self) -> bool:
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
            print(f"❌ Error checking balance: {e}")
            return False

    def on_message(self, ws, message: str):
        """Handle WebSocket messages"""
        try:
            data = json.loads(message)

            if data.get("type") == "price":
                tick = data.get("data", {})
                price = tick.get("price")
                timestamp = tick.get("timestamp")

                if price:
                    self.price_history.append(price)

                    # Make trading decision
                    if self.has_tokens and self.session_started:
                        if self.should_buy(price):
                            self.execute_trade("buy")
                        elif self.should_sell(price):
                            self.execute_trade("sell")

            elif data.get("type") == "device":
                # Device signals (LED colors, etc.)
                pass

        except Exception as e:
            print(f"❌ Error processing message: {e}")

    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"❌ WebSocket error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        self.is_connected = False
        print("❌ WebSocket closed. Reconnecting in 3 seconds...")
        time.sleep(3)
        self.connect()

    def on_open(self, ws):
        """Handle WebSocket open"""
        self.is_connected = True
        print("✅ Connected to backend")
        # Subscribe to price feed
        subscribe_msg = json.dumps(
            {"type": "subscribe", "userId": self.wallet_address}
        )
        ws.send(subscribe_msg)
        print(f"📡 Subscribed to price feed for {self.wallet_address}")

    def connect(self):
        """Connect to WebSocket server"""
        ws_url = WS_URL.replace("http", "ws") if WS_URL.startswith("http") else WS_URL
        print(f"🔌 Connecting to {ws_url}...")

        ws = websocket.WebSocketApp(
            ws_url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
        )

        ws.run_forever()

    def run(self):
        """Main agent loop"""
        print("=" * 50)
        print("tradeOS AI Trading Agent")
        print("=" * 50)
        print(f"Agent Wallet: {self.wallet_address}")
        print(f"API URL: {API_URL}")
        print(f"WS URL: {WS_URL}")
        print("=" * 50)

        # Start trading session
        if not self.start_session():
            print("❌ Failed to start session. Exiting.")
            sys.exit(1)

        # Wait a bit for tokens to be airdropped
        print("⏳ Waiting for tokens...")
        time.sleep(5)

        # Check token balance
        if not self.check_token_balance():
            print("⚠️  No tokens detected. Agent will wait...")
            # Keep checking
            while not self.has_tokens:
                time.sleep(5)
                self.check_token_balance()
            print("✅ Tokens detected!")

        # Connect to WebSocket and start trading
        self.connect()


if __name__ == "__main__":
    if not AGENT_WALLET:
        print("❌ AGENT_WALLET environment variable is required")
        print("   export AGENT_WALLET=0xAgentWalletAddress")
        sys.exit(1)

    agent = MomentumAgent(AGENT_WALLET)
    try:
        agent.run()
    except KeyboardInterrupt:
        print("\n👋 Agent stopped")
        sys.exit(0)

