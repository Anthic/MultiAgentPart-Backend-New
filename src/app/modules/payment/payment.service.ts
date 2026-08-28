import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { getTransactionId } from '../../utils/getTransactionId';
import { SSLService } from '../sslCommerz/sslCommerz.service';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../user/user.model';
import {  PAYMENT_STATUS, PaymentType } from './payment.interface';
import { Payment } from './payment.model';

const initRechargePayment = async (
  userId: string,
  amountBDT: number,
  paymentType: PaymentType = 'wallet_topup',
): Promise<{ paymentUrl: string; transactionId: string }> => {
  if (amountBDT < 10) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Minimum recharge amount is ৳10 BDT');
  }

  let user = null;
  try {
    user = await User.findOne({ $or: [{ id: userId }, { _id: userId }] });
  } catch {
    user = await User.findOne({ id: userId });
  }
  const transactionId = getTransactionId();


  await Payment.create({
    userId,
    transactionId,
    amountBDT,
    paymentType,
    status: PAYMENT_STATUS.UNPAID,
  });


  const paymentUrl = await SSLService.sslPaymentInit({
    amount: amountBDT,
    transactionId,
    name: user?.name || 'AtlashAI User',
    email: user?.email || 'user@atlashai.com',
  });

  return { paymentUrl, transactionId };
};

const handlePaymentSuccess = async (query: Record<string, string>) => {
  const { transactionId } = query;

  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found');
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    return { success: true, message: 'Payment already processed' };
  }


  payment.status = PAYMENT_STATUS.PAID;
  await payment.save();


  await WalletService.addFundsToWallet(payment.userId, payment.amountBDT);

  return { success: true, message: `Successfully recharged ৳${payment.amountBDT} to your wallet!` };
};

const handlePaymentFail = async (query: Record<string, string>) => {
  const { transactionId } = query;
  await Payment.findOneAndUpdate(
    { transactionId },
    { status: PAYMENT_STATUS.FAILED },
  );
  return { success: false, message: 'Payment failed' };
};

const handlePaymentCancel = async (query: Record<string, string>) => {
  const { transactionId } = query;
  await Payment.findOneAndUpdate(
    { transactionId },
    { status: PAYMENT_STATUS.CANCELLED },
  );
  return { success: false, message: 'Payment cancelled by user' };
};

const handleIPNValidation = async (body: any) => {
  const payload = body || {};
  const val_id = payload.val_id || payload.valId;
  const tran_id = payload.tran_id || payload.tranId || payload.transactionId;

  if (!val_id || !tran_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid IPN data: val_id and tran_id are required');
  }

  const validationData = await SSLService.validatePayment(val_id);

  if (validationData.status === 'VALID' || validationData.status === 'VALIDATED') {
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (payment && payment.status !== PAYMENT_STATUS.PAID) {
      payment.status = PAYMENT_STATUS.PAID;
      payment.paymentGatewayData = validationData;
      await payment.save();
      await WalletService.addFundsToWallet(payment.userId, payment.amountBDT);
    }
  }

  return { success: true, data: validationData };
};

export const PaymentService = {
  initRechargePayment,
  handlePaymentSuccess,
  handlePaymentFail,
  handlePaymentCancel,
  handleIPNValidation,
};
