import { PriceSimulator } from "./index";
import { TrendSignal } from "@meme-trainer/types";

describe("PriceSimulator", () => {
  let simulator: PriceSimulator;

  beforeEach(() => {
    simulator = new PriceSimulator({
      initialPrice: 1.0,
      volatility: 0.02,
      difficulty: "noob",
      tickInterval: 100,
    });
  });

  afterEach(() => {
    simulator.stop();
  });

  test("should start and emit price ticks", (done) => {
    let tickCount = 0;
    simulator.start((price, trend) => {
      tickCount++;
      expect(price).toBeGreaterThan(0);
      expect(["up", "down", "sideways", "whale", "rug"]).toContain(trend);
      if (tickCount >= 5) {
        simulator.stop();
        done();
      }
    });
  });

  test("should respect initial price", () => {
    const sim = new PriceSimulator({
      initialPrice: 5.0,
      volatility: 0.01,
      difficulty: "noob",
      tickInterval: 100,
    });
    expect(sim.getCurrentPrice()).toBe(5.0);
    sim.stop();
  });

  test("should stop emitting ticks when stopped", (done) => {
    let tickCount = 0;
    simulator.start((price, trend) => {
      tickCount++;
      if (tickCount === 3) {
        simulator.stop();
        setTimeout(() => {
          expect(tickCount).toBe(3);
          done();
        }, 200);
      }
    });
  });
});
