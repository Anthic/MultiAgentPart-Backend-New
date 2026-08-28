import { Schema, model } from 'mongoose';
import { INote } from './note.interface';

const noteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    sourceUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    embeddingId: { type: String },
    audioUrl: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Full-text search index on title & content
noteSchema.index({ title: 'text', content: 'text' });

export const Note = model<INote>('Note', noteSchema);
