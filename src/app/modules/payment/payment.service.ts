import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { getTransactionId } from '../../utils/getTransactionId';
import { SSLService } from '../sslCommerz/sslCommerz.service';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../user/user.model';
import { PAYMENT_STATUS, PaymentType } from './payment.interface';
import { Payment } from './payment.model';

const MIN_RECHARGE_BDT = 10;
const MAX_RECHARGE_BDT = Number(process.env.MAX_RECHARGE_BDT) || 50000;
const AMOUNT_TOLERANCE = 0.01;

const initRechargePayment = async (
  userId: string,
  amountBDT: number,
  paymentType: PaymentType = 'wallet_topup',
): Promise<{ paymentUrl: string; transactionId: string }> => {
  // Only wallet top-ups exist. 'subscription_pro' used to be accepted but only
  // ever credited the wallet and never changed the tier (APP-4).
  if (paymentType !== 'wallet_topup') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported payment type');
  }
  if (!Number.isFinite(amountBDT) || amountBDT < MIN_RECHARGE_BDT) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Minimum recharge amount is ৳${MIN_RECHARGE_BDT} BDT`);
  }
  if (amountBDT > MAX_RECHARGE_BDT) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Maximum recharge amount is ৳${MAX_RECHARGE_BDT} BDT`);
  }
  const amount = Math.round(amountBDT * 100) / 100;

  const user = await User.findOne({ id: userId });
  const transactionId = getTransactionId();

  await Payment.create({
    userId,
    transactionId,
    amountBDT: amount,
    currency: 'BDT',
    paymentType,
    status: PAYMENT_STATUS.UNPAID,
  });

  const paymentUrl = await SSLService.sslPaymentInit({
    amount,
    transactionId,
    name: user?.name || 'AtlashAI User',
    email: user?.email || 'user@atlashai.com',
  });

  return { paymentUrl, transactionId };
};

const GATEWAY_OK = new Set(['VALID', 'VALIDATED']);

/**
 * Ask SSLCommerz (server to server) whether val_id is a real, successful
 * payment for THIS transaction, THIS amount and THIS currency. Anything the
 * browser/IPN body claims is untrusted until it matches here.
 */
const verifyWithGateway = async (
  payment: { transactionId: string; amountBDT: number },
  valId: string,
): Promise<{ ok: boolean; data: any }> => {
  const data = await SSLService.validatePayment(valId);
  if (!data || !GATEWAY_OK.has(String(data.status))) return { ok: false, data };
  if (String(data.tran_id) !== payment.transactionId) return { ok: false, data };
  if (String(data.currency_type || 'BDT').toUpperCase() !== 'BDT') return { ok: false, data };
  const paid = Number(data.currency_amount ?? data.amount);
  if (!Number.isFinite(paid) || Math.abs(paid - payment.amountBDT) > AMOUNT_TOLERANCE) {
    return { ok: false, data };
  }
  return { ok: true, data };
};

/**
 * Credit the wallet at most once per payment, however many times (and from
 * however many paths: success redirect, IPN, retries) this is called.
 * The claim is one atomic findOneAndUpdate; whoever wins it credits.
 */
const creditOnce = async (
  transactionId: string,
  valId: string,
  gatewayData: any,
): Promise<boolean> => {
  const claimed = await Payment.findOneAndUpdate(
    {
      transactionId,
      creditedAt: null,
      status: { $ne: PAYMENT_STATUS.REFUNDED },
    },
    {
      $set: {
        status: PAYMENT_STATUS.PAID,
        creditedAt: new Date(),
        gatewayValId: valId,
        paymentGatewayData: gatewayData,
      },
    },
    { new: true },
  );
  if (!claimed) return false; // already credited by someone else

  try {
    await WalletService.addFundsToWallet(claimed.userId, claimed.amountBDT);
  } catch (err) {
    // Release the claim so a gateway retry (IPN) can complete the credit.
    await Payment.updateOne(
      { transactionId },
      { $set: { status: PAYMENT_STATUS.UNPAID, creditedAt: null } },
    );
    throw err;
  }
  return true;
};

const settle = async (
  transactionId: string | undefined,
  valId: string | undefined,
): Promise<{ credited: boolean; amountBDT: number }> => {
  if (!transactionId || !valId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'tran_id and val_id are required');
  }

  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found');
  }
  if (payment.creditedAt) {
    return { credited: false, amountBDT: payment.amountBDT };
  }

  const { ok, data } = await verifyWithGateway(payment, valId);
  if (!ok) {
    await Payment.updateOne(
      { transactionId, creditedAt: null, status: PAYMENT_STATUS.UNPAID },
      { $set: { status: PAYMENT_STATUS.FAILED } },
    );
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment validation failed');
  }

  const credited = await creditOnce(transactionId, valId, data);
  return { credited, amountBDT: payment.amountBDT };
};

const handlePaymentSuccess = async (queryOrBody: Record<string, string>) => {
  const transactionId = queryOrBody.tran_id || queryOrBody.transactionId;
  const valId = queryOrBody.val_id;

  const { credited, amountBDT } = await settle(transactionId, valId);
  return {
    success: true,
    message: credited
      ? `Successfully recharged ৳${amountBDT} to your wallet!`
      : 'Payment already processed',
  };
};

// fail/cancel callbacks are unauthenticated browser redirects, so they may only
// move UNPAID -> FAILED/CANCELLED. They can never touch a PAID payment.
const markIfUnpaid = async (
  transactionId: string | undefined,
  status: PAYMENT_STATUS,
) => {
  if (!transactionId || typeof transactionId !== 'string') return;
  await Payment.updateOne(
    { transactionId, status: PAYMENT_STATUS.UNPAID, creditedAt: null },
    { $set: { status } },
  );
};

const handlePaymentFail = async (params: Record<string, string>) => {
  await markIfUnpaid(params.tran_id || params.transactionId, PAYMENT_STATUS.FAILED);
  return { success: false, message: 'Payment failed' };
};

const handlePaymentCancel = async (params: Record<string, string>) => {
  await markIfUnpaid(params.tran_id || params.transactionId, PAYMENT_STATUS.CANCELLED);
  return { success: false, message: 'Payment cancelled by user' };
};

const handleIPNValidation = async (body: any) => {
  const payload = body || {};
  const valId = payload.val_id || payload.valId;
  const tranId = payload.tran_id || payload.tranId || payload.transactionId;

  if (!valId || !tranId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid IPN data: val_id and tran_id are required');
  }

  const { credited } = await settle(String(tranId), String(valId));
  // Do not echo gateway payloads back to an unauthenticated caller.
  return { success: true, credited };
};

export const PaymentService = {
  initRechargePayment,
  handlePaymentSuccess,
  handlePaymentFail,
  handlePaymentCancel,
  handleIPNValidation,
};
