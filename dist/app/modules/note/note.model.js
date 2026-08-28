"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Note = void 0;
const mongoose_1 = require("mongoose");
const noteSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    sourceUrl: { type: String, trim: true },
    tags: [{ type: String, trim: true, lowercase: true, index: true }],
    embeddingId: { type: String },
    audioUrl: { type: String },
}, {
    timestamps: true,
    versionKey: false,
});
noteSchema.index({ title: 'text', content: 'text' });
exports.Note = (0, mongoose_1.model)('Note', noteSchema);
//# sourceMappingURL=note.model.js.map