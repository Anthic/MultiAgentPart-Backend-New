"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paper = void 0;
const mongoose_1 = require("mongoose");
const citationSchema = new mongoose_1.Schema({
    citationKey: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    doi: { type: String },
    authors: [{ type: String }],
    year: { type: String },
}, { _id: false });
const peerReviewResultSchema = new mongoose_1.Schema({
    overallScore: { type: Number, min: 0, max: 100 },
    methodologyFeedback: { type: String },
    domainFeedback: { type: String },
    clarityFeedback: { type: String },
}, { _id: false });
const paperSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    contentMarkdown: { type: String, default: '' },
    abstract: { type: String, default: '' },
    citations: [citationSchema],
    peerReviewResults: peerReviewResultSchema,
    attachedNotes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Note' }],
    status: {
        type: String,
        enum: ['draft', 'in_review', 'published', 'archived'],
        default: 'draft',
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Paper = (0, mongoose_1.model)('Paper', paperSchema);
//# sourceMappingURL=paper.model.js.map