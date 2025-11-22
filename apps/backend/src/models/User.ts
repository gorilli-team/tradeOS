import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  smartAccountAddress?: string;
  totalPoints: number;
  totalTrades: number;
  totalVolume: number;
  bestTrade: number;
  worstTrade: number;
  winRate: number;
  isAI: boolean;
  lastActive: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    smartAccountAddress: { type: String, index: true },
    totalPoints: { type: Number, default: 0, index: true },
    totalTrades: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    bestTrade: { type: Number, default: 0 },
    worstTrade: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    isAI: { type: Boolean, default: false, index: true },
    lastActive: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

