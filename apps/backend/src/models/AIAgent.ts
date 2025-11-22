import mongoose, { Schema, Document } from "mongoose";

export interface IAIAgent extends Document {
  agentId: string; // Unique identifier for the agent
  name: string; // Display name
  ownerAddress: string; // Wallet address of the owner
  description?: string; // Agent description/strategy
  strategy?: string; // Strategy type (e.g., "momentum", "mean_reversion", "ml")
  walletAddress: string; // The wallet address used for trading (acts as userId)
  smartAccountAddress?: string; // ERC-4337 smart account address
  agentUrl?: string; // URL where the agent is hosted (optional, for external agents)
  isActive: boolean; // Whether the agent is currently active
  totalPoints: number;
  totalTrades: number;
  totalVolume: number;
  createdAt: Date;
  lastActive: Date;
}

const AIAgentSchema = new Schema<IAIAgent>(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    ownerAddress: { type: String, required: true, index: true },
    description: { type: String },
    strategy: { type: String },
    walletAddress: { type: String, required: true, unique: true, index: true },
    smartAccountAddress: { type: String, index: true },
    agentUrl: { type: String }, // URL where agent is hosted
    isActive: { type: Boolean, default: false },
    totalPoints: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.AIAgent ||
  mongoose.model<IAIAgent>("AIAgent", AIAgentSchema);
