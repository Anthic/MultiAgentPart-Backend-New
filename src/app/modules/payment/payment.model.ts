import { Schema, model } from 'mongoose';
import { IPayment, PAYMENT_STATUS } from './payment.interface';

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amountBDT: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },
    paymentType: {
      type: String,
      enum: ['wallet_topup', 'subscription_pro'],
      default: 'wallet_topup',
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
    },
    creditedAt: { type: Date, default: null },
    gatewayValId: { type: String },
    paymentGatewayData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Payment = model<IPayment>('Payment', paymentSchema);
