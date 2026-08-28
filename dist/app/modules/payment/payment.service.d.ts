import { PaymentType } from './payment.interface';
export declare const PaymentService: {
    initRechargePayment: (userId: string, amountBDT: number, paymentType?: PaymentType) => Promise<{
        paymentUrl: string;
        transactionId: string;
    }>;
    handlePaymentSuccess: (query: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    handlePaymentFail: (query: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    handlePaymentCancel: (query: Record<string, string>) => Promise<{
        success: boolean;
        message: string;
    }>;
    handleIPNValidation: (body: any) => Promise<{
        success: boolean;
        data: any;
    }>;
};
