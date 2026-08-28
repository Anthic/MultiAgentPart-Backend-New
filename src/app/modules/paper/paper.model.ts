import { Schema, model } from 'mongoose';
import { IPaper } from './paper.interface';

const citationSchema = new Schema(
  {
    citationKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    doi: { type: String },
    authors: [{ type: String }],
    year: { type: String },
  },
  { _id: false },
);

const peerReviewResultSchema = new Schema(
  {
    overallScore: { type: Number, min: 0, max: 100 },
    methodologyFeedback: { type: String },
    domainFeedback: { type: String },
    clarityFeedback: { type: String },
  },
  { _id: false },
);

const paperSchema = new Schema<IPaper>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    contentMarkdown: { type: String, default: '' },
    abstract: { type: String, default: '' },
    citations: [citationSchema],
    peerReviewResults: peerReviewResultSchema,
    attachedNotes: [{ type: Schema.Types.ObjectId, ref: 'Note' }],
    status: {
      type: String,
      enum: ['draft', 'in_review', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Paper = model<IPaper>('Paper', paperSchema);
