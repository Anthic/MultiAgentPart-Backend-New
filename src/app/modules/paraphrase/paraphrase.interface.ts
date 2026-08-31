import { Types } from 'mongoose';

export type ParaphraseMode = 'academic' | 'simplify' | 'executive' | 'humanize';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface IParaphraseRequest {
  text: string;
  mode: ParaphraseMode;
}

export interface ITokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IParaphraseResult {
  paraphrased_text: string;
  mode: ParaphraseMode;
  provider_used: string;
  duration_sec: number;
  token_usage: ITokenUsage;
  costBDT: number;
  wallet?: {
    previousBalance: number;
    deducted: number;
    newBalance: number;
  };
  auditLogId?: string;
}

export interface ICostEstimate {
  charCount: number;
  estimatedTokens: number;
  estimatedCostBDT: number;
  model: string;
}

export interface ITierLimits {
  MAX_CHARACTERS: number;
  MAX_REQUESTS_PER_DAY: number;
  MAX_REQUESTS_PER_HOUR: number;
}

export interface IParaphraseHistory {
  _id?: Types.ObjectId | string;
  userId: string;
  originalText: string;
  paraphrasedText: string;
  mode: ParaphraseMode;
  providerUsed: string;
  tokenUsage: ITokenUsage;
  costBDT: number;
  durationSec?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
