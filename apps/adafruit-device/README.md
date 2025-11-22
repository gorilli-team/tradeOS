# Adafruit Device Integration

This directory contains code to connect a physical Adafruit device to the tradeOS backend.

## Supported Hardware

- **Adafruit Feather/ESP32**: WiFi-enabled boards
- **Adafruit Circuit Playground**: Built-in buttons and NeoPixels
- **Adafruit Metro/Arduino**: With WiFi shield or Ethernet
- **Raspberry Pi**: With Adafruit GPIO add-ons

## Quick Start

### Option 1: CircuitPython (Recommended for Adafruit boards)

1. Install CircuitPython on your Adafruit board
2. Copy `adafruit_device.py` to your board's CIRCUITPY drive
3. Install required libraries:
   ```bash
   # On your computer, with the board connected
   circup install adafruit_requests adafruit_minimqtt
   ```
4. Update `secrets.py` with your WiFi credentials and backend URL
5. The device will automatically connect and start receiving signals

### Option 2: Python Script (Raspberry Pi or Computer)

1. Install dependencies:
   ```bash
   pip install websocket-client requests adafruit-circuitpython-neopixel
   ```

2. For GPIO buttons (Raspberry Pi):
   ```bash
   pip install RPi.GPIO
   ```

3. Run the script:
   ```bash
   python adafruit_device.py
   ```

### Option 3: Arduino/ESP32

Use the Arduino WebSocket library and HTTP client library. See `adafruit_device.ino` for reference.

## Configuration

Set environment variables or update the script:

- `WS_URL`: WebSocket URL (default: `ws://localhost:3001`)
- `API_URL`: REST API URL (default: `http://localhost:3001`)
- `USER_ID`: Your wallet address (from Privy)
- `WIFI_SSID`: WiFi network name
- `WIFI_PASSWORD`: WiFi password

## Hardware Setup

### Buttons
- **Button 1** (GPIO pin 5): BUY
- **Button 2** (GPIO pin 6): SELL
- **Button 3** (GPIO pin 13): PANIC EXIT

### LED/NeoPixel
- **NeoPixel pin**: GPIO pin 18 (or use built-in NeoPixels on Circuit Playground)
- Colors map to trends:
  - Green: Up trend
  - Red: Down trend
  - Yellow: Sideways
  - Purple: Whale activity
  - Orange: Rug pull

## Testing

1. Start the backend: `cd apps/backend && pnpm dev`
2. Start your device script
3. Connect your wallet in the frontend
4. Start a trading session
5. The LED should change colors based on price trends
6. Press buttons to execute trades

