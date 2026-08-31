import { Schema, model } from 'mongoose';
import { IParaphraseHistory } from './paraphrase.interface';

const ParaphraseHistorySchema = new Schema<IParaphraseHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    paraphrasedText: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['academic', 'simplify', 'executive', 'humanize'],
      default: 'academic',
      required: true,
    },
    providerUsed: {
      type: String,
      default: 'worker-groq',
    },
    tokenUsage: {
      prompt_tokens: { type: Number, default: 0 },
      completion_tokens: { type: Number, default: 0 },
      total_tokens: { type: Number, default: 0 },
    },
    costBDT: {
      type: Number,
      required: true,
      default: 0,
    },
    durationSec: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const ParaphraseHistory = model<IParaphraseHistory>(
  'ParaphraseHistory',
  ParaphraseHistorySchema,
);
