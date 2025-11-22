#!/usr/bin/env python3
"""
Adafruit Device Controller for tradeOS
Connects to backend WebSocket and controls LED/buttons
"""

import json
import time
import sys
import os
from typing import Optional

try:
    import websocket
except ImportError:
    print("Installing websocket-client...")
    os.system("pip install websocket-client")
    import websocket

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system("pip install requests")
    import requests

# Configuration
WS_URL = os.getenv("WS_URL", "ws://localhost:3001")
API_URL = os.getenv("API_URL", "http://localhost:3001")
USER_ID = os.getenv("USER_ID", "default")

# Hardware configuration (adjust based on your setup)
LED_PIN = 18  # GPIO pin for NeoPixel (or use built-in on Circuit Playground)
BUTTON_BUY_PIN = 5
BUTTON_SELL_PIN = 6
BUTTON_PANIC_PIN = 13

# Color mapping
COLOR_MAP = {
    "green": (0, 255, 0),
    "red": (255, 0, 0),
    "yellow": (255, 255, 0),
    "purple": (128, 0, 128),
    "orange": (255, 165, 0),
}

# Try to import hardware libraries
HAS_NEOPIXEL = False
HAS_GPIO = False

try:
    import board
    import neopixel
    HAS_NEOPIXEL = True
    print("✅ NeoPixel library found")
except ImportError:
    print("⚠️  NeoPixel library not found. LED will be simulated in console.")

try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
    print("✅ RPi.GPIO library found")
except ImportError:
    print("⚠️  RPi.GPIO not found. Buttons will be simulated via keyboard input.")

# Initialize hardware
if HAS_NEOPIXEL:
    try:
        pixels = neopixel.NeoPixel(board.D18, 1, brightness=0.5)
        print("✅ NeoPixel initialized on pin 18")
    except Exception as e:
        print(f"⚠️  Could not initialize NeoPixel: {e}")
        HAS_NEOPIXEL = False

if HAS_GPIO:
    try:
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(BUTTON_BUY_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(BUTTON_SELL_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(BUTTON_PANIC_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        print("✅ GPIO buttons initialized")
    except Exception as e:
        print(f"⚠️  Could not initialize GPIO: {e}")
        HAS_GPIO = False


def set_led_color(color: Optional[str]):
    """Set LED color based on signal"""
    if not color:
        return
    
    rgb = COLOR_MAP.get(color.lower(), (0, 0, 0))
    
    if HAS_NEOPIXEL:
        try:
            pixels[0] = rgb
            pixels.show()
            print(f"🟢 LED: {color.upper()}")
        except Exception as e:
            print(f"Error setting LED: {e}")
    else:
        # Console simulation
        emoji = {
            "green": "🟢",
            "red": "🔴",
            "yellow": "🟡",
            "purple": "🟣",
            "orange": "🟠",
        }.get(color.lower(), "⚪")
        print(f"{emoji} LED: {color.upper()}")


def send_trade(trade_type: str):
    """Send trade request to backend"""
    endpoint = f"{API_URL}/trade/{trade_type}"
    
    try:
        response = requests.post(
            endpoint,
            json={"userId": USER_ID, "type": trade_type},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"✅ Trade executed: {trade_type.upper()}")
            else:
                print(f"❌ Trade failed: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error sending trade: {e}")


def on_message(ws, message):
    """Handle WebSocket messages"""
    try:
        data = json.loads(message)
        
        if data.get("type") == "device":
            signal = data.get("data", {})
            color = signal.get("color")
            message_text = signal.get("message")
            
            if color:
                set_led_color(color)
            
            if message_text:
                print(f"📢 {message_text}")
        
        elif data.get("type") == "price":
            # Optionally log price updates
            pass
            
    except Exception as e:
        print(f"Error parsing message: {e}")


def on_error(ws, error):
    """Handle WebSocket errors"""
    print(f"❌ WebSocket error: {error}")


def on_close(ws, close_status_code, close_msg):
    """Handle WebSocket close"""
    print("❌ WebSocket closed. Reconnecting in 3 seconds...")
    time.sleep(3)
    connect_websocket()


def on_open(ws):
    """Handle WebSocket open"""
    print("✅ Connected to backend")
    # Subscribe to user's feed
    subscribe_msg = json.dumps({"type": "subscribe", "userId": USER_ID})
    ws.send(subscribe_msg)
    print(f"📡 Subscribed to user: {USER_ID}")


def connect_websocket():
    """Connect to WebSocket server"""
    print(f"🔌 Connecting to {WS_URL}...")
    
    ws = websocket.WebSocketApp(
        WS_URL,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close,
        on_open=on_open
    )
    
    ws.run_forever()


def check_buttons():
    """Check button states (runs in separate thread)"""
    if not HAS_GPIO:
        return
    
    last_buy = True
    last_sell = True
    last_panic = True
    
    while True:
        try:
            # Check BUY button
            if GPIO.input(BUTTON_BUY_PIN) == GPIO.LOW and last_buy:
                send_trade("buy")
                last_buy = False
            elif GPIO.input(BUTTON_BUY_PIN) == GPIO.HIGH:
                last_buy = True
            
            # Check SELL button
            if GPIO.input(BUTTON_SELL_PIN) == GPIO.LOW and last_sell:
                send_trade("sell")
                last_sell = False
            elif GPIO.input(BUTTON_SELL_PIN) == GPIO.HIGH:
                last_sell = True
            
            # Check PANIC button
            if GPIO.input(BUTTON_PANIC_PIN) == GPIO.LOW and last_panic:
                send_trade("panic")
                last_panic = False
            elif GPIO.input(BUTTON_PANIC_PIN) == GPIO.HIGH:
                last_panic = True
            
            time.sleep(0.1)  # Debounce
            
        except Exception as e:
            print(f"Error checking buttons: {e}")
            time.sleep(1)


def keyboard_input():
    """Handle keyboard input for button simulation"""
    print("\n⌨️  Keyboard Controls:")
    print("  [B] - Buy")
    print("  [S] - Sell")
    print("  [P] - Panic Exit")
    print("  [Q] - Quit\n")
    
    import select
    import tty
    import termios
    
    old_settings = termios.tcgetattr(sys.stdin)
    try:
        tty.setraw(sys.stdin.fileno())
        
        while True:
            if select.select([sys.stdin], [], [], 0.1)[0]:
                char = sys.stdin.read(1).lower()
                
                if char == 'b':
                    send_trade("buy")
                elif char == 's':
                    send_trade("sell")
                elif char == 'p':
                    send_trade("panic")
                elif char == 'q' or char == '\x03':  # Ctrl+C
                    print("\n👋 Goodbye!")
                    break
    finally:
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)


if __name__ == "__main__":
    print("=" * 50)
    print("tradeOS Adafruit Device Controller")
    print("=" * 50)
    print(f"WebSocket URL: {WS_URL}")
    print(f"API URL: {API_URL}")
    print(f"User ID: {USER_ID}")
    print("=" * 50)
    
    # Start button checking thread if GPIO is available
    if HAS_GPIO:
        import threading
        button_thread = threading.Thread(target=check_buttons, daemon=True)
        button_thread.start()
        print("✅ Button monitoring started")
    else:
        # Use keyboard input instead
        import threading
        keyboard_thread = threading.Thread(target=keyboard_input, daemon=True)
        keyboard_thread.start()
    
    # Connect to WebSocket (blocking)
    try:
        connect_websocket()
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        if HAS_GPIO:
            GPIO.cleanup()
        sys.exit(0)

