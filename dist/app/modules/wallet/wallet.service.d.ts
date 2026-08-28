import { ITokenAuditLog, IWallet } from "./wallet.interface";
export declare const WalletService: {
    getWalletBalance: (userId: string) => Promise<IWallet>;
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
    addFundsToWallet: (userId: string, amountBDT: number) => Promise<IWallet>;
    getAuditLogs: (userId: string, limit?: number) => Promise<ITokenAuditLog[]>;
};
