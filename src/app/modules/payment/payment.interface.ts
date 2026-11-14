import { Document, Types } from 'mongoose';

export enum PAYMENT_STATUS {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export type PaymentType = 'wallet_topup' | 'subscription_pro';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: string;
  transactionId: string;
  amountBDT: number;
  currency: string;
  paymentType: PaymentType;
  status: PAYMENT_STATUS;
  // Set exactly once, atomically, when the wallet is credited. It is the
  // single-credit guard shared by the browser redirect and the IPN.
  creditedAt?: Date | null;
  gatewayValId?: string;
  paymentGatewayData?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
