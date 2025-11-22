# 🚀 Quick Start Guide

## Installation

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all dependencies
pnpm install
```

## Running the Project

### Option 1: Run Everything (Recommended)

```bash
# Start backend, frontend, and device simulator
pnpm dev
```

### Option 2: Run Individually

**Terminal 1 - Backend:**
```bash
cd apps/backend
pnpm dev
# Backend runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
pnpm dev
# Frontend runs on http://localhost:3000
```

**Terminal 3 - Device Simulator (Optional):**
```bash
cd apps/device-simulator
pnpm dev
# Use keyboard: B=Buy, S=Sell, P=Panic, Q=Quit
```

## First Steps

1. **Start the backend** - The backend will start the price simulator automatically when you start a session
2. **Open the frontend** - Navigate to http://localhost:3000
3. **Start a session** - The frontend will automatically start a session when it loads
4. **Start trading** - Click BUY/SELL buttons or use the device simulator

## Testing

```bash
# Run all tests
pnpm test

# Test specific packages
cd packages/price-simulator && pnpm test
cd packages/trading-engine && pnpm test
```

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is already in use:
- Backend: Set `PORT=3002` in `apps/backend/.env`
- Frontend: Set port in `apps/frontend/package.json` dev script: `next dev -p 3001`

### Module Not Found Errors
Make sure you've run `pnpm install` in the root directory. The workspace dependencies need to be installed first.

### WebSocket Connection Issues
- Ensure the backend is running before starting the frontend
- Check that the WebSocket URL matches your backend port

