import mongoose, { Schema, Document } from "mongoose";

export interface ITrade extends Document {
  userId: string;
  walletAddress: string;
  smartAccountAddress?: string;
  type: "buy" | "sell" | "panic";
  price: number;
  amount?: number;
  usdValue: number;
  timestamp: Date;
  difficulty: "noob" | "degen" | "pro";
  pointsEarned: number;
  isAI?: boolean;
}

const TradeSchema = new Schema<ITrade>(
  {
    userId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    smartAccountAddress: { type: String, index: true },
    type: { type: String, enum: ["buy", "sell", "panic"], required: true },
    price: { type: Number, required: true },
    amount: { type: Number },
    usdValue: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    difficulty: {
      type: String,
      enum: ["noob", "degen", "pro"],
      required: true,
    },
    pointsEarned: { type: Number, default: 0, index: true },
    isAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Trade || mongoose.model<ITrade>("Trade", TradeSchema);

