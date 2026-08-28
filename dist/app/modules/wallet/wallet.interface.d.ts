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
    createdAt?: Date;
}
export interface IWallet {
    _id?: Types.ObjectId | string;
    userId: string;
    balanceBDT: number;
    totalSpentBDT: number;
    totalTokensUsed: number;
    subscriptionTier: 'free' | 'pro' | 'enterprise';
    createdAt?: Date;
    updatedAt?: Date;
}
