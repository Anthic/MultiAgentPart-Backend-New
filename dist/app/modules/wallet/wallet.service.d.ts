import { ITokenAuditLog, IWallet } from './wallet.interface';
export declare const WalletService: {
    getWalletBalance: (userId: string) => Promise<IWallet>;
    getOrCreateWallet: (userId: string) => Promise<IWallet>;
    reserveFreeResearch: (userId: string) => Promise<boolean>;
    refundFreeResearch: (userId: string) => Promise<void>;
    deductCredits: (userId: string, payload: {
        action: ITokenAuditLog["action"];
        modelUsed: string;
        promptTokens: number;
        completionTokens: number;
        costBDT: number;
        creditsDeducted: number;
    }) => Promise<{
        wallet: IWallet;
        auditLog: ITokenAuditLog;
    }>;
    refundCredits: (userId: string, payload: {
        costBDT: number;
        tokensToRefund?: number;
        reason?: string;
    }) => Promise<IWallet>;
    addFundsToWallet: (userId: string, amountBDT: number) => Promise<IWallet>;
    getAuditLogs: (userId: string, limit?: number) => Promise<ITokenAuditLog[]>;
};
