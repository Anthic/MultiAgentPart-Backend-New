import { ISSLPaymentPayload } from './sslCommerz.interface';
export declare const SSLService: {
    sslPaymentInit: (payload: ISSLPaymentPayload) => Promise<string>;
    validatePayment: (val_id: string) => Promise<any>;
};
