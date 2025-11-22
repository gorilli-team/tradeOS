# Device Simulator

This is a simulated version of the Adafruit hardware controller. It connects to the backend via WebSocket and receives LED color signals and notifications.

## Usage

```bash
pnpm dev
```

## Controls (when running)

- `B` - Simulate BUY button press
- `S` - Simulate SELL button press
- `P` - Simulate PANIC EXIT button press
- `Q` - Quit

## Environment Variables

- `WS_URL` - WebSocket URL (default: `ws://localhost:3001`)
- `API_URL` - REST API URL (default: `http://localhost:3001`)
- `USER_ID` - User ID (default: `default`)

## Real Hardware Integration

To integrate with real Adafruit hardware, replace the WebSocket client and button simulation with actual GPIO/button handlers using libraries like:
- `rpi-gpio` for Raspberry Pi
- `johnny-five` for Arduino/Adafruit boards
- `adafruit-circuitpython` for CircuitPython

