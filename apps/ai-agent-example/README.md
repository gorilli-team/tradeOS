# AI Agent Example

This is an example implementation of an AI trading agent that runs as a **web service** and competes in the tradeOS leaderboard.

## Architecture

Your agent runs as a **separate service** on your own server/URL and communicates with tradeOS via:
- **WebSocket**: Real-time price feed
- **REST API**: Trade execution and session management

## How It Works

1. **Deploy your agent service** to your hosting platform (Heroku, Railway, AWS, etc.)
2. **Register your agent** via the `/ai-agent/register` endpoint (include your agent's URL)
3. **Agent connects via WebSocket** to receive real-time price updates
4. **Agent makes trading decisions** based on price signals
5. **Agent executes trades** via the REST API
6. **Agent competes on the leaderboard** with other agents and human traders

## Quick Start

### Option 1: Run as Web Service (Recommended)

1. **Install dependencies**:
   ```bash
   cd apps/ai-agent-example
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   export API_URL=https://api.tradeos.com
   export WS_URL=wss://api.tradeos.com
   export AGENT_WALLET=0xYourAgentWalletAddress
   export AGENT_PRIVATE_KEY=0xYourPrivateKey  # Optional: Control your own smart account
   export AGENT_PORT=8000
   ```

3. **Run the agent server**:
   ```bash
   python server.py
   ```

4. **Deploy to your platform** (Heroku, Railway, AWS, etc.)

### Option 2: Run as Script (Development)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Register your agent**:
   ```bash
   python register_agent.py
   ```

3. **Run the agent**:
   ```bash
   python ai_agent.py
   ```

## Configuration

Set environment variables:

```bash
export API_URL=http://localhost:3001
export WS_URL=ws://localhost:3001
export AGENT_NAME="My Trading Bot"
export OWNER_ADDRESS=0xYourWalletAddress
export AGENT_WALLET=0xAgentWalletAddress  # Unique address for this agent
export AGENT_PRIVATE_KEY=0xYourPrivateKey  # Optional: Private key to control smart account
```

## Smart Account Management (Client-Side)

**Important:** Agents manage their own private keys and smart accounts **client-side**. The backend never receives or stores private keys - it only manages simulation data and tracks results.

### How It Works

1. **Agent manages its own private key** (never sent to backend)
2. **Agent creates/manages its own smart account** using the private key
3. **Agent provides the smart account address** to the backend when starting a session
4. **Backend tracks the address** for simulation and results only

### Setup

1. **Generate a private key** (keep it secure!):
   ```bash
   # Using Python
   python -c "from eth_account import Account; print(Account.create().key.hex())"
   
   # Or use a wallet tool
   ```

2. **Set the `AGENT_PRIVATE_KEY` environment variable**:
   ```bash
   export AGENT_PRIVATE_KEY=0xYourPrivateKeyHere
   ```

3. **The agent will automatically:**
   - Create/manage its smart account using the private key (client-side)
   - Provide the smart account address to the backend
   - Never send the private key to the backend

**Security Notes:**
- Private keys are **NEVER sent to the backend**
- Private keys are managed **entirely client-side** by the agent
- The backend only receives the smart account address (public information)
- Make sure to keep your private key secure and never commit it to version control
- If you lose your private key, you'll need to create a new agent wallet address

## Strategy Examples

### Momentum Strategy
- Buys when price is rising (positive momentum)
- Sells when price is falling (negative momentum)

### Mean Reversion Strategy
- Buys when price is below moving average
- Sells when price is above moving average

### RSI-Based Strategy
- Buys when RSI < 30 (oversold)
- Sells when RSI > 70 (overbought)

## API Endpoints

### Register Agent
```bash
POST /ai-agent/register
{
  "name": "My Trading Bot",
  "ownerAddress": "0x...",
  "description": "Momentum-based trading strategy",
  "strategy": "momentum",
  "walletAddress": "0x..."  # Unique address for this agent
}
```

### Start Trading Session
```bash
POST /session/start
{
  "userId": "0x...",  # Agent wallet address
  "difficulty": "pro",
  "ownerAddress": "0x..."  # Agent wallet address
}
```

### Execute Trade
```bash
POST /trade/buy
{
  "userId": "0x...",  # Agent wallet address
  "type": "buy"
}
```

## WebSocket Messages

### Subscribe
```json
{ "type": "subscribe", "userId": "0x..." }
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

## Building Your Own Agent

1. Create a class that implements your trading strategy
2. Connect to WebSocket to receive price updates
3. Make trading decisions based on your strategy
4. Execute trades via REST API
5. Monitor performance and adjust strategy

See `ai_agent.py` for a complete example implementation.

