"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const wallet_model_1 = require("./wallet.model");
const SIGNUP_BONUS_BDT = 10.0;
const getOrCreateWallet = async (userId) => {
    let wallet = await wallet_model_1.Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await wallet_model_1.Wallet.create({
            userId,
            balanceBDT: SIGNUP_BONUS_BDT,
        });
    }
    return wallet;
};
const getWalletBalance = async (userId) => {
    return await getOrCreateWallet(userId);
};
const reserveFreeResearch = async (userId) => {
    await getOrCreateWallet(userId);
    const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId, freeResearchUsed: false }, { $set: { freeResearchUsed: true } }, { new: true });
    return Boolean(wallet);
};
const refundFreeResearch = async (userId) => {
    await wallet_model_1.Wallet.updateOne({ userId }, { $set: { freeResearchUsed: false } });
};
const deductCredits = async (userId, payload) => {
    const wallet = await getOrCreateWallet(userId);
    if (wallet.balanceBDT < payload.costBDT) {
        throw new ApiError_1.default(http_status_1.default.PAYMENT_REQUIRED, `Insufficient BDT balance. Required: ৳${payload.costBDT.toFixed(2)}, Available: ৳${wallet.balanceBDT.toFixed(2)}. Please recharge via bKash/Nagad.`);
    }
    const updatedWallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId, balanceBDT: { $gte: payload.costBDT } }, {
        $inc: {
            balanceBDT: -payload.costBDT,
            totalSpentBDT: payload.costBDT,
            totalTokensUsed: payload.promptTokens + payload.completionTokens,
        },
    }, {
        new: true,
    });
    if (!updatedWallet) {
        throw new ApiError_1.default(http_status_1.default.PAYMENT_REQUIRED, 'Insufficient BDT balance.');
    }
    const auditLog = await wallet_model_1.TokenAuditLog.create({
        userId,
        action: payload.action,
        modelUsed: payload.modelUsed,
        promptTokens: payload.promptTokens,
        completionTokens: payload.completionTokens,
        totalTokens: payload.promptTokens + payload.completionTokens,
        costBDT: payload.costBDT,
        creditsDeducted: payload.creditsDeducted,
    });
    return { wallet: updatedWallet, auditLog };
};
const refundCredits = async (userId, payload) => {
    if (payload.costBDT <= 0)
        return await getOrCreateWallet(userId);
    const tokens = payload.tokensToRefund || 0;
    const updatedWallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId }, {
        $inc: {
            balanceBDT: payload.costBDT,
            totalSpentBDT: -payload.costBDT,
            totalTokensUsed: -tokens,
        },
    }, { new: true });
    return updatedWallet || (await getOrCreateWallet(userId));
};
const addFundsToWallet = async (userId, amountBDT) => {
    if (amountBDT <= 0) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Recharge amount must be greater than 0 BDT');
    }
    await getOrCreateWallet(userId);
    const updatedWallet = await wallet_model_1.Wallet.findOneAndUpdate({ userId }, { $inc: { balanceBDT: amountBDT } }, { new: true });
    return updatedWallet;
};
const getAuditLogs = async (userId, limit = 20) => {
    return await wallet_model_1.TokenAuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};
exports.WalletService = {
    getWalletBalance,
    getOrCreateWallet,
    reserveFreeResearch,
    refundFreeResearch,
    deductCredits,
    refundCredits,
    addFundsToWallet,
    getAuditLogs,
};
//# sourceMappingURL=wallet.service.js.map