# tradeOS

A gamified trading simulator controlled by a physical Adafruit device. Trade simulated tokens using buy/sell buttons and LED color signals. The system includes levels, PnL tracking, trading rules, and a fast price-simulation engine.

## Project Structure

```
/apps
  /backend          - Node.js REST API + WebSocket server
  /frontend         - Next.js frontend with real-time charts
  /device-simulator - Simulated Adafruit hardware controller
/packages
  /price-simulator  - Fast token price simulation engine
  /trading-engine   - CEX-like trading engine
  /types            - Shared TypeScript types
  /utils            - Shared utility functions
```

## Tech Stack

- **Monorepo**: pnpm + Turborepo
- **Backend**: Node.js + Express + WebSocket
- **Frontend**: Next.js 14 + React + Tailwind CSS + Recharts
- **Language**: TypeScript (strict mode)
- **Validation**: Zod
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or start individually:
cd apps/backend && pnpm dev
cd apps/frontend && pnpm dev
cd apps/device-simulator && pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
cd packages/price-simulator && pnpm test
cd packages/trading-engine && pnpm test
```

## Features

### Trading Engine
- **Noob Mode**: Fixed position sizes ($50), safety limits (max 80% position)
- **DeGen Mode**: Percentage-based position sizing (10% of balance)
- **Pro Mode**: Dynamic position sizing with profit targets and stop losses

### Price Simulator
- **Patterns**: Pump, dump, rug pull, chop, whale spike, parabolic, slow grind
- **Trend Signals**: Up (green), Down (red), Sideways (yellow), Whale (purple), Rug (orange)
- **Difficulty-based volatility**: Higher volatility in Pro mode

### Game Mechanics
- **XP System**: Gain XP based on realized PnL
- **Level Progression**: Level = floor(sqrt(XP / 100)) + 1
- **Realized & Unrealized PnL**: Track both realized gains and paper gains
- **Session Management**: Start/reset trading sessions

### Device Integration
- **WebSocket Communication**: Real-time LED color signals
- **Button Controls**: BUY, SELL, PANIC EXIT
- **Notifications**: Level-up alerts, price alerts

## API Endpoints

### REST API

- `POST /trade/buy` - Execute buy trade
- `POST /trade/sell` - Execute sell trade
- `GET /state?userId=<id>` - Get current game state
- `POST /session/start` - Start a new trading session
- `POST /session/reset` - Reset user session

### WebSocket

Connect to `ws://localhost:3001` and subscribe:

```json
{ "type": "subscribe", "userId": "default" }
```

Messages received:
- `{ "type": "price", "data": { price, timestamp, trend } }`
- `{ "type": "device", "data": { type, color, message } }`

## Usage Example

1. **Start Backend**: `cd apps/backend && pnpm dev`
2. **Start Frontend**: `cd apps/frontend && pnpm dev` (runs on http://localhost:3000)
3. **Start Device Simulator** (optional): `cd apps/device-simulator && pnpm dev`

4. Open http://localhost:3000 in your browser
5. Select difficulty mode (Noob/DeGen/Pro)
6. Start trading using the BUY/SELL buttons
7. Watch the real-time price chart and LED signals

## Configuration

Environment variables:

- `PORT` - Backend port (default: 3001)
- `NEXT_PUBLIC_API_URL` - Frontend API URL (default: http://localhost:3001)
- `WS_URL` - Device simulator WebSocket URL (default: ws://localhost:3001)

## Testing

Each package includes Jest tests:

```bash
# Price Simulator Tests
cd packages/price-simulator
pnpm test

# Trading Engine Tests
cd packages/trading-engine
pnpm test
```

## Hardware Integration

The `device-simulator` app simulates the Adafruit hardware. To integrate real hardware:

1. Replace WebSocket client with GPIO handlers
2. Use libraries like:
   - `rpi-gpio` for Raspberry Pi
   - `johnny-five` for Arduino/Adafruit boards
   - `adafruit-circuitpython` for CircuitPython

3. Map physical buttons to trade actions:
   - Button 1 → BUY
   - Button 2 → SELL
   - Button 3 → PANIC EXIT

4. Map LED signals to colors:
   - Green → Up trend
   - Red → Down trend
   - Yellow → Sideways
   - Purple → Whale activity
   - Orange → Rug pull

## License

MIT

## Contributing

This is a hackathon project. Feel free to fork and extend!

