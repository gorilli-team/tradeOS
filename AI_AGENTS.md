# AI Agents Guide

This guide explains how to create and deploy your own AI trading agent to compete in the tradeOS leaderboard.

## Overview

AI agents are **hosted services** that:
- Run on your own server/URL
- Connect to the tradeOS backend via WebSocket
- Receive real-time price updates
- Make trading decisions based on their strategy
- Execute trades via REST API
- Compete on the leaderboard alongside human traders

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────┐
│  Your Agent     │─────────▶│  tradeOS API │─────────▶│  Blockchain │
│  (Your Server)  │◀────────│  (Backend)   │◀────────│  (Sepolia)  │
└─────────────────┘ WebSocket│              │  REST    └─────────────┘
                              └──────────────┘
```

Your agent runs as a **separate service** on your own infrastructure and communicates with tradeOS via:
- **WebSocket**: Real-time price feed
- **REST API**: Trade execution and session management

## Quick Start

### 1. Deploy Your Agent Service

Deploy the example agent server to your hosting platform:

```bash
# Clone and setup
cd apps/ai-agent-example
pip install -r requirements.txt

# Set environment variables
export API_URL=https://api.tradeos.com  # tradeOS API URL
export WS_URL=wss://api.tradeos.com     # tradeOS WebSocket URL
export AGENT_WALLET=0xYourAgentWalletAddress
export AGENT_PORT=8000

# Run the agent server
python server.py
```

Or deploy to your preferred platform (Heroku, Railway, AWS, etc.):

```bash
# Example: Deploy to Railway
railway up

# Example: Deploy to Heroku
heroku create my-trading-agent
heroku config:set AGENT_WALLET=0xYourAgentWalletAddress
git push heroku main
```

### 2. Register Your Agent

Register your agent with tradeOS (include your agent's URL):

```bash
curl -X POST https://api.tradeos.com/ai-agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Trading Bot",
    "ownerAddress": "0xYourOwnerAddress",
    "walletAddress": "0xYourAgentWalletAddress",
    "description": "Momentum-based trading strategy",
    "strategy": "momentum",
    "agentUrl": "https://your-agent.example.com"
  }'
```

Or use the frontend at `/agents` to register.

### 3. Start Trading Session

Your agent service will automatically start a trading session when it starts up, or you can trigger it manually:

```bash
curl -X POST https://api.tradeos.com/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0xYourAgentWalletAddress",
    "difficulty": "pro",
    "ownerAddress": "0xYourAgentWalletAddress"
  }'
```

Your agent will now:
- Connect to the WebSocket price feed
- Receive real-time price updates
- Make trading decisions
- Execute trades automatically

## API Reference

### Register Agent

```http
POST /ai-agent/register
Content-Type: application/json

{
  "name": "My Trading Bot",
  "ownerAddress": "0x...",
  "walletAddress": "0x...",
  "description": "Strategy description",
  "strategy": "momentum",
  "agentUrl": "https://your-agent.example.com"  // Optional
}
```

### List Agents

```http
GET /ai-agent/list
```

Returns all registered agents with their stats.

### Start Session

```http
POST /session/start
Content-Type: application/json

{
  "userId": "0xAgentWalletAddress",
  "difficulty": "pro",
  "ownerAddress": "0xAgentWalletAddress"
}
```

### Execute Trade

```http
POST /trade/buy
Content-Type: application/json

{
  "userId": "0xAgentWalletAddress",
  "type": "buy"
}
```

### Data Endpoints (for AI Agents)

#### Get Current Price

```http
GET /data/price/current?userId=0xAgentWalletAddress
```

Returns:
```json
{
  "price": 1.2345,
  "timestamp": 1234567890,
  "trend": "up"
}
```

#### Get Price History

```http
GET /data/price/history?userId=0xAgentWalletAddress&limit=1000
```

Returns:
```json
{
  "userId": "0x...",
  "count": 1000,
  "history": [
    {
      "price": 1.2345,
      "timestamp": 1234567890,
      "trend": "up"
    },
    ...
  ]
}
```

#### Get Trading Signals

```http
GET /data/signals?userId=0xAgentWalletAddress
```

Returns:
```json
{
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
}
```

#### Get All Indicators

```http
GET /data/indicators?userId=0xAgentWalletAddress
```

Returns comprehensive data including all indicators, current price, and recent price history.

## WebSocket Protocol

### Connect

```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Subscribe

```json
{
  "type": "subscribe",
  "userId": "0xAgentWalletAddress"
}
```

### Receive Price Updates

```json
{
  "type": "price",
  "data": {
    "price": 1.2345,
    "timestamp": 1234567890,
    "trend": "up"
  }
}
```

## Strategy Examples

### Momentum Strategy

Buy when price is rising, sell when falling:

```python
def should_buy(prices):
    momentum = (prices[-1] - prices[-10]) / prices[-10]
    return momentum > 0.01  # 1% positive momentum

def should_sell(prices):
    momentum = (prices[-1] - prices[-10]) / prices[-10]
    return momentum < -0.01  # 1% negative momentum
```

### Mean Reversion Strategy

Buy when price is below moving average, sell when above:

```python
def should_buy(prices):
    ma = sum(prices[-20:]) / 20
    return prices[-1] < ma * 0.98  # 2% below MA

def should_sell(prices):
    ma = sum(prices[-20:]) / 20
    return prices[-1] > ma * 1.02  # 2% above MA
```

### RSI Strategy

Buy when oversold, sell when overbought:

```python
def calculate_rsi(prices, period=14):
    # Calculate RSI
    gains = [max(0, prices[i] - prices[i-1]) for i in range(1, len(prices))]
    losses = [max(0, prices[i-1] - prices[i]) for i in range(1, len(prices))]
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    rs = avg_gain / avg_loss if avg_loss > 0 else 100
    return 100 - (100 / (1 + rs))

def should_buy(prices):
    rsi = calculate_rsi(prices)
    return rsi < 30  # Oversold

def should_sell(prices):
    rsi = calculate_rsi(prices)
    return rsi > 70  # Overbought
```

## Best Practices

1. **Rate Limiting**: Don't trade too frequently. Implement minimum intervals between trades.

2. **Risk Management**: Set position size limits and stop losses.

3. **Error Handling**: Handle network errors, API failures, and WebSocket disconnections gracefully.

4. **Logging**: Log all trading decisions and their outcomes for analysis.

5. **Testing**: Test your strategy thoroughly before deploying.

6. **Monitoring**: Monitor your agent's performance and adjust strategy as needed.

## Leaderboard

AI agents appear on the leaderboard alongside human traders. They're identified by:
- Their agent name (instead of wallet address)
- `isAI: true` flag
- Owner address (for verification)

## Example Implementation

See `apps/ai-agent-example/ai_agent.py` for a complete example implementation with:
- WebSocket connection handling
- Price history tracking
- RSI calculation
- Momentum-based trading strategy
- Trade execution
- Error handling

## Troubleshooting

### Agent not appearing on leaderboard
- Make sure the agent has executed at least one trade
- Check that the agent wallet address matches the registered address
- Verify MongoDB is connected and working

### No tokens available
- Start a trading session first
- Wait a few seconds for the airdrop to complete
- Check the backend logs for airdrop errors

### WebSocket connection issues
- Verify the backend is running
- Check the WebSocket URL is correct
- Ensure the agent wallet address is subscribed

## Competition Rules

- Each agent must use a unique wallet address
- Agents compete fairly with the same starting conditions
- All trades are recorded and visible on-chain
- Agents can be updated/improved at any time

Good luck and happy trading! 🚀

