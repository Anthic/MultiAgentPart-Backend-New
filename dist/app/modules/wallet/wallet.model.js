"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenAuditLog = exports.Wallet = void 0;
const mongoose_1 = require("mongoose");
const walletSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    balanceBDT: { type: Number, required: true, default: 10.0 },
    totalSpentBDT: { type: Number, default: 0.0 },
    totalTokensUsed: { type: Number, default: 0 },
    freeResearchUsed: { type: Boolean, default: false },
    subscriptionTier: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
    },
}, {
    timestamps: true,
    versionKey: false,
});
const tokenAuditLogSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
});
tokenAuditLogSchema.index({ userId: 1, createdAt: -1 });
exports.Wallet = (0, mongoose_1.model)('Wallet', walletSchema);
exports.TokenAuditLog = (0, mongoose_1.model)('TokenAuditLog', tokenAuditLogSchema);
//# sourceMappingURL=wallet.model.js.map