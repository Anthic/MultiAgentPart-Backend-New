import { Types } from 'mongoose';

export interface ITokenAuditLog {
  _id?: Types.ObjectId | string;
  userId: string;
  action: 'paraphrase' | 'deep_research' | 'peer_review' | 'slide_gen' | 'gap_finder' | 'draft_section';
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costBDT: number;
  creditsDeducted: number;
  // 'refund' rows record money returned for a failed job, so the audit trail
  // no longer shows a charge with nothing offsetting it.
  type?: 'charge' | 'refund';
  reason?: string;
  createdAt?: Date;
}

export interface IWallet {
  _id?: Types.ObjectId | string;
  userId: string;
  balanceBDT: number;        // Available balance in BDT (৳)
  totalSpentBDT: number;     // Total lifetime spending
  totalTokensUsed: number;   // Total lifetime tokens consumed
  freeResearchUsed: boolean; // The account's one-time complimentary research run
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt?: Date;
  updatedAt?: Date;
}
