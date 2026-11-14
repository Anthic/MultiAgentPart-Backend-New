import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { ITokenAuditLog, IWallet } from './wallet.interface';
import { TokenAuditLog, Wallet } from './wallet.model';

const SIGNUP_BONUS_BDT = 10.0;

// Atomic get-or-create. The old findOne-then-create could, under concurrent
// first requests, throw a duplicate-key error or create two wallets' worth of
// signup bonus. $setOnInsert only ever applies to the single inserted doc.
const getOrCreateWallet = async (userId: string): Promise<IWallet> => {
  const upsert = () =>
    Wallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, balanceBDT: SIGNUP_BONUS_BDT } },
      { upsert: true, new: true },
    );
  try {
    return (await upsert()) as IWallet;
  } catch (err: any) {
    // Two concurrent upserts can race on the unique index; the loser just reads.
    if (err?.code === 11000) {
      const existing = await Wallet.findOne({ userId });
      if (existing) return existing;
    }
    throw err;
  }
};

const getWalletBalance = async (userId: string): Promise<IWallet> => {
  return await getOrCreateWallet(userId);
};

const reserveFreeResearch = async (userId: string): Promise<boolean> => {
  await getOrCreateWallet(userId);
  const wallet = await Wallet.findOneAndUpdate(
    { userId, freeResearchUsed: false },
    { $set: { freeResearchUsed: true } },
    { new: true },
  );
  return Boolean(wallet);
};

const refundFreeResearch = async (userId: string): Promise<void> => {
  await Wallet.updateOne({ userId }, { $set: { freeResearchUsed: false } });
};

const deductCredits = async (
  userId: string,
  payload: {
    action: ITokenAuditLog['action'];
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    costBDT: number;
    creditsDeducted: number;
  },
): Promise<{ wallet: IWallet; auditLog: ITokenAuditLog }> => {
  const wallet = await getOrCreateWallet(userId);
  if (wallet.balanceBDT < payload.costBDT) {
    throw new ApiError(
      httpStatus.PAYMENT_REQUIRED,
      `Insufficient BDT balance. Required: ৳${payload.costBDT.toFixed(2)}, Available: ৳${wallet.balanceBDT.toFixed(2)}. Please recharge via bKash/Nagad.`,
    );
  }

  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId, balanceBDT: { $gte: payload.costBDT } },
    {
      $inc: {
        balanceBDT: -payload.costBDT,
        totalSpentBDT: payload.costBDT,
        totalTokensUsed: payload.promptTokens + payload.completionTokens,
      },
    },
    {
      new: true,
    },
  );
  if (!updatedWallet) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Insufficient BDT balance.');
  }
  const auditLog = await TokenAuditLog.create({
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

const refundCredits = async (
  userId: string,
  payload: {
    costBDT: number;
    tokensToRefund?: number;
    reason?: string;
    action?: ITokenAuditLog['action'];
  },
): Promise<IWallet> => {
  if (payload.costBDT <= 0) return await getOrCreateWallet(userId);

  const tokens = payload.tokensToRefund || 0;
  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: {
        balanceBDT: payload.costBDT,
        totalSpentBDT: -payload.costBDT,
        totalTokensUsed: -tokens,
      },
    },
    { new: true },
  );

  // Write a matching audit row so a refunded charge is visible as refunded.
  await TokenAuditLog.create({
    userId,
    action: payload.action || 'deep_research',
    modelUsed: 'refund',
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costBDT: payload.costBDT,
    creditsDeducted: payload.costBDT,
    type: 'refund',
    reason: payload.reason,
  });

  return updatedWallet || (await getOrCreateWallet(userId));
};

const addFundsToWallet = async (
  userId: string,
  amountBDT: number,
): Promise<IWallet> => {
  if (!Number.isFinite(amountBDT) || amountBDT <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recharge amount must be greater than 0 BDT');
  }
  await getOrCreateWallet(userId);
  const updatedWallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balanceBDT: amountBDT } },
    { new: true },
  );
  return updatedWallet!;
};

const getAuditLogs = async (userId: string, limit: number = 20): Promise<ITokenAuditLog[]> => {
  return await TokenAuditLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

export const WalletService = {
  getWalletBalance,
  getOrCreateWallet,
  reserveFreeResearch,
  refundFreeResearch,
  deductCredits,
  refundCredits,
  addFundsToWallet,
  getAuditLogs,
};
