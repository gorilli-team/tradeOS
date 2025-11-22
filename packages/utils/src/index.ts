import { DifficultyMode } from "@tradeOS/types";

export function calculateXP(gain: number, difficulty: DifficultyMode): number {
  const baseXP = Math.max(0, Math.floor(gain / 10));
  const multiplier =
    difficulty === "pro" ? 1.5 : difficulty === "degen" ? 1.2 : 1.0;
  return Math.floor(baseXP * multiplier);
}

export function calculateLevel(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
