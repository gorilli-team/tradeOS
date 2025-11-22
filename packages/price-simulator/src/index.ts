import { PriceSimulatorConfig, TrendSignal, PriceTick } from "tradeOS/types";

export class PriceSimulator {
  private config: PriceSimulatorConfig;
  private currentPrice: number;
  private intervalId?: NodeJS.Timeout;
  private callback?: (price: number, trend: TrendSignal) => void;
  private patternState: {
    pump?: { active: boolean; duration: number; intensity: number };
    dump?: { active: boolean; duration: number; intensity: number };
    rug?: { active: boolean; duration: number };
    whale?: { active: boolean; duration: number; spike: number };
    parabolic?: { active: boolean; duration: number; acceleration: number };
    slowGrind?: { active: boolean; direction: number };
    chop?: { active: boolean; duration: number };
  };
  private tickCount: number = 0;

  constructor(config: PriceSimulatorConfig) {
    this.config = {
      initialPrice: config.initialPrice || 1.0,
      volatility: config.volatility || 0.02,
      difficulty: config.difficulty || "noob",
      tickInterval: config.tickInterval || 1000,
      patterns: config.patterns || {
        pump: true,
        dump: true,
        rug: true,
        chop: true,
        whale: true,
        parabolic: true,
        slowGrind: true,
      },
    };
    this.currentPrice = this.config.initialPrice;
    this.patternState = {};
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Initialize pattern states
    this.patternState = {
      pump: { active: false, duration: 0, intensity: 0 },
      dump: { active: false, duration: 0, intensity: 0 },
      rug: { active: false, duration: 0 },
      whale: { active: false, duration: 0, spike: 0 },
      parabolic: { active: false, duration: 0, acceleration: 0 },
      slowGrind: { active: false, direction: 0 },
      chop: { active: false, duration: 0 },
    };
  }

  start(callback: (price: number, trend: TrendSignal) => void): void {
    this.callback = callback;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.config.tickInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private tick(): void {
    this.tickCount++;
    const trend = this.calculateNextPrice();
    if (this.callback) {
      this.callback(this.currentPrice, trend);
    }
  }

  private calculateNextPrice(): TrendSignal {
    // Update pattern states
    this.updatePatterns();

    // Base random walk with volatility
    const baseVolatility = this.getVolatility();
    let priceChange =
      (Math.random() - 0.5) * 2 * baseVolatility * this.currentPrice;

    // Apply active patterns
    if (this.patternState.pump?.active) {
      priceChange += this.currentPrice * this.patternState.pump.intensity * 0.1;
    }
    if (this.patternState.dump?.active) {
      priceChange -= this.currentPrice * this.patternState.dump.intensity * 0.1;
    }
    if (this.patternState.rug?.active) {
      priceChange -= this.currentPrice * 0.5; // Massive dump
    }
    if (this.patternState.whale?.active) {
      priceChange += this.patternState.whale.spike;
    }
    if (this.patternState.parabolic?.active) {
      priceChange +=
        this.currentPrice * this.patternState.parabolic.acceleration * 0.05;
      this.patternState.parabolic.acceleration *= 1.1;
    }
    if (this.patternState.slowGrind?.active) {
      priceChange +=
        this.currentPrice * this.patternState.slowGrind.direction * 0.01;
    }
    if (this.patternState.chop?.active) {
      priceChange = (Math.random() - 0.5) * this.currentPrice * 0.02; // Sideways noise
    }

    // Update price
    this.currentPrice = Math.max(0.01, this.currentPrice + priceChange);

    // Determine trend signal
    return this.determineTrend(priceChange);
  }

  private updatePatterns(): void {
    // Randomly trigger patterns based on config
    if (this.config.patterns?.pump && Math.random() < 0.02) {
      this.patternState.pump = {
        active: true,
        duration: 20 + Math.random() * 30,
        intensity: 0.5 + Math.random() * 0.5,
      };
    }
    if (this.patternState.pump?.active) {
      this.patternState.pump.duration--;
      if (this.patternState.pump.duration <= 0) {
        this.patternState.pump.active = false;
      }
    }

    if (this.config.patterns?.dump && Math.random() < 0.02) {
      this.patternState.dump = {
        active: true,
        duration: 20 + Math.random() * 30,
        intensity: 0.5 + Math.random() * 0.5,
      };
    }
    if (this.patternState.dump?.active) {
      this.patternState.dump.duration--;
      if (this.patternState.dump.duration <= 0) {
        this.patternState.dump.active = false;
      }
    }

    if (this.config.patterns?.rug && Math.random() < 0.005) {
      this.patternState.rug = { active: true, duration: 5 };
    }
    if (this.patternState.rug?.active) {
      this.patternState.rug.duration--;
      if (this.patternState.rug.duration <= 0) {
        this.patternState.rug.active = false;
      }
    }

    if (this.config.patterns?.whale && Math.random() < 0.01) {
      this.patternState.whale = {
        active: true,
        duration: 3,
        spike: this.currentPrice * (0.1 + Math.random() * 0.2),
      };
    }
    if (this.patternState.whale?.active) {
      this.patternState.whale.duration--;
      if (this.patternState.whale.duration <= 0) {
        this.patternState.whale.active = false;
      }
    }

    if (this.config.patterns?.parabolic && Math.random() < 0.01) {
      this.patternState.parabolic = {
        active: true,
        duration: 30 + Math.random() * 40,
        acceleration: 1.0,
      };
    }
    if (this.patternState.parabolic?.active) {
      this.patternState.parabolic.duration--;
      if (this.patternState.parabolic.duration <= 0) {
        this.patternState.parabolic.active = false;
        this.patternState.parabolic.acceleration = 0;
      }
    }

    if (this.config.patterns?.slowGrind && Math.random() < 0.05) {
      this.patternState.slowGrind = {
        active: true,
        direction: Math.random() > 0.5 ? 1 : -1,
      };
    }
    if (this.patternState.slowGrind?.active && Math.random() < 0.1) {
      this.patternState.slowGrind.active = false;
    }

    if (this.config.patterns?.chop && Math.random() < 0.03) {
      this.patternState.chop = {
        active: true,
        duration: 15 + Math.random() * 20,
      };
    }
    if (this.patternState.chop?.active) {
      this.patternState.chop.duration--;
      if (this.patternState.chop.duration <= 0) {
        this.patternState.chop.active = false;
      }
    }
  }

  private getVolatility(): number {
    const baseVol = this.config.volatility;
    const difficultyMultiplier = {
      noob: 0.5,
      degen: 1.0,
      pro: 1.5,
    };
    return baseVol * difficultyMultiplier[this.config.difficulty];
  }

  private determineTrend(priceChange: number): TrendSignal {
    const percentChange = (priceChange / this.currentPrice) * 100;

    if (this.patternState.rug?.active) {
      return "rug";
    }
    if (this.patternState.whale?.active) {
      return "whale";
    }
    if (Math.abs(percentChange) < 0.5) {
      return "sideways";
    }
    if (percentChange > 0) {
      return "up";
    }
    return "down";
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }
}
