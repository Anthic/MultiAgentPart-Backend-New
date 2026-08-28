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
  paymentType: PaymentType;
  status: PAYMENT_STATUS;
  paymentGatewayData?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
