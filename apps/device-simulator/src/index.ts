import WebSocket from "ws";
import { DeviceSignal } from "@tradeOS/types";

const WS_URL = process.env.WS_URL || "ws://localhost:3001";
const USER_ID = process.env.USER_ID || "default";

// Simulated device state
let currentLEDColor: string = "off";
let isConnected = false;

// ANSI color codes for terminal output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  purple: "\x1b[34m",
  orange: "\x1b[35m",
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
};

function connectWebSocket(): void {
  console.log(`🔌 Connecting to ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    isConnected = true;
    console.log("✅ Connected to backend");
    ws.send(JSON.stringify({ type: "subscribe", userId: USER_ID }));
  });

  ws.on("message", (data: WebSocket.Data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === "device") {
        handleDeviceSignal(message.data as DeviceSignal);
      } else if (message.type === "price") {
        // Optionally handle price updates
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    isConnected = false;
  });

  ws.on("close", () => {
    isConnected = false;
    console.log("❌ Disconnected. Reconnecting in 3 seconds...");
    setTimeout(connectWebSocket, 3000);
  });
}

function handleDeviceSignal(signal: DeviceSignal): void {
  switch (signal.type) {
    case "led":
      if (signal.color) {
        setLEDColor(signal.color);
      }
      break;
    case "alert":
      console.log(
        `${colors.orange}🚨 ALERT: ${signal.message || "Alert triggered"}${
          colors.reset
        }`
      );
      break;
    case "notification":
      console.log(
        `${colors.cyan}📢 ${signal.message || "Notification"}${colors.reset}`
      );
      if (signal.level) {
        console.log(
          `${colors.cyan}   🎉 Level Up! Now at level ${signal.level}${colors.reset}`
        );
      }
      break;
  }
}

function setLEDColor(color: string): void {
  if (currentLEDColor === color) return;

  currentLEDColor = color;
  const colorCode = colors[color as keyof typeof colors] || colors.reset;
  const emoji =
    {
      green: "🟢",
      red: "🔴",
      yellow: "🟡",
      purple: "🟣",
      orange: "🟠",
    }[color] || "⚪";

  console.log(
    `${colorCode}${emoji} LED: ${color.toUpperCase()}${colors.reset}`
  );
}

// Simulate button presses (for testing)
function simulateButtonPress(button: string): void {
  if (!isConnected) {
    console.log("❌ Not connected. Cannot send button press.");
    return;
  }

  // In a real implementation, this would send to the backend
  console.log(`🔘 Simulated ${button} button press`);

  // Example: Send trade request via HTTP (device would do this)
  const API_URL = process.env.API_URL || "http://localhost:3001";

  let endpoint = "";
  let type = "";

  switch (button.toLowerCase()) {
    case "buy":
      endpoint = "/trade/buy";
      type = "buy";
      break;
    case "sell":
      endpoint = "/trade/sell";
      type = "sell";
      break;
    case "panic":
      endpoint = "/trade/sell";
      type = "panic";
      break;
    default:
      console.log("Unknown button");
      return;
  }

  // Use built-in fetch (Node 18+) or http module
  fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, type }),
  })
    .then((res: Response) => res.json())
    .then((data: any) => {
      if (data.success) {
        console.log(`✅ Trade executed: ${type}`);
      } else {
        console.log(`❌ Trade failed: ${data.error}`);
      }
    })
    .catch((error: any) => {
      console.error("Error executing trade:", error);
    });
}

// CLI interface for testing
console.log("🎮 MemeTrainer Device Simulator");
console.log("================================\n");

// Connect to backend
connectWebSocket();

// Simulate button presses via stdin (for testing)
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  console.log("\nControls:");
  console.log("  [B] - Buy");
  console.log("  [S] - Sell");
  console.log("  [P] - Panic Exit");
  console.log("  [Q] - Quit\n");

  process.stdin.on("data", (key: string) => {
    const char = key.toString().toLowerCase();

    switch (char) {
      case "b":
        simulateButtonPress("buy");
        break;
      case "s":
        simulateButtonPress("sell");
        break;
      case "p":
        simulateButtonPress("panic");
        break;
      case "q":
      case "\u0003": // Ctrl+C
        console.log("\n👋 Goodbye!");
        process.exit();
        break;
    }
  });
}
