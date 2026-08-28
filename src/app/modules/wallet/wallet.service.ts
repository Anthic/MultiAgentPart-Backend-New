import httpStatus from "http-status"
import ApiError from "../../errors/ApiError"
import { ITokenAuditLog, IWallet } from "./wallet.interface"
import { TokenAuditLog, Wallet } from "./wallet.model"



const SIGNUP_BONUS_BDT  = 10.0

const getOrCreateWallet = async (userId : string) : Promise<IWallet>=> {

    let wallet = await Wallet.findOne({userId})
    if (!wallet) {
        wallet = await Wallet.create({
            userId,
            balanceBDT: SIGNUP_BONUS_BDT,
        })
    }

    return wallet
}

const getWalletBalance = async (userId: string): Promise<IWallet> => {
  return await getOrCreateWallet(userId);
};


const  deductCredits  = async (userId : string , payload : {
    action : ITokenAuditLog['action'],
    modelUsed : string,
    promptTokens : number
    completionTokens : number
    costBDT : number
    creditsDeducted : number

}) : Promise<{wallet :IWallet, auditLog : ITokenAuditLog}> => {
const wallet = await getOrCreateWallet(userId)
 if (wallet.balanceBDT < payload.costBDT) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED,       `Insufficient BDT balance. Required: ৳${payload.costBDT.toFixed(2)}, Available: ৳${wallet.balanceBDT.toFixed(2)}. Please recharge via bKash/Nagad.`,
 )
 }

 const updatedWallet = await Wallet.findOneAndUpdate(
    {userId , balanceBDT : {$gte : payload.costBDT}},
    {
        $inc : {
            balanceBDT : -payload.costBDT,
            totalSpentBDT : payload.costBDT,
            totalTokensUsed : payload.promptTokens + payload.completionTokens
        }
    },
    {
    new: true
    }
 )
 if(!updatedWallet) {
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
}

const addFundsToWallet = async (
  userId: string,
  amountBDT: number,
): Promise<IWallet> => {
  if (amountBDT <= 0) {
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
  deductCredits,
  addFundsToWallet,
  getAuditLogs,
};
