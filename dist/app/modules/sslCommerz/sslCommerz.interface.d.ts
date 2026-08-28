export interface ISSLPaymentPayload {
    amount: number;
    transactionId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
}
