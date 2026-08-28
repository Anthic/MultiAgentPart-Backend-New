import { Schema, model } from 'mongoose';
import { ITokenAuditLog, IWallet } from './wallet.interface';


const walletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balanceBDT: { type: Number, required: true, default: 10.0 }, // ৳10 Signup bonus
    totalSpentBDT: { type: Number, default: 0.0 },
    totalTokensUsed: { type: Number, default: 0 },
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const tokenAuditLogSchema = new Schema<ITokenAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ['paraphrase', 'deep_research', 'peer_review', 'slide_gen', 'gap_finder', 'draft_section'],
      required: true,
    },
    modelUsed: { type: String, required: true },
    promptTokens: { type: Number, required: true },
    completionTokens: { type: Number, required: true },
    totalTokens: { type: Number, required: true },
    costBDT: { type: Number, required: true },
    creditsDeducted: { type: Number, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

tokenAuditLogSchema.index({ userId: 1, createdAt: -1 });

export const Wallet = model<IWallet>('Wallet', walletSchema);
export const TokenAuditLog = model<ITokenAuditLog>('TokenAuditLog', tokenAuditLogSchema);
