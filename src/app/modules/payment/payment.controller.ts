import { Request, Response } from 'express';
import httpStatus from 'http-status';
import config from '../../../config';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { PaymentService } from './payment.service';

const initRecharge = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { amountBDT, paymentType } = req.body;

  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaymentService.initRechargePayment(
    userId,
    Number(amountBDT),
    paymentType,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SSLCommerz payment initialized successfully',
    data: result,
  });
});

// SSLCommerz sends tran_id in the POST body; our own callback URLs also carry
// ?transactionId=. Read both, never trust amount/status from here.
const callbackParams = (req: Request): Record<string, string> =>
  ({ ...req.query, ...req.body }) as Record<string, string>;

const redirectWith = (res: Response, base: string, transactionId: string, message: string) =>
  res.redirect(
    `${base}&transactionId=${encodeURIComponent(transactionId)}&message=${encodeURIComponent(message)}`,
  );

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const payload = callbackParams(req);
  const transactionId = String(payload.tran_id || payload.transactionId || '');
  try {
    const result = await PaymentService.handlePaymentSuccess(payload);
    redirectWith(res, config.ssl.success_frontend_url, transactionId, result.message);
  } catch (err: any) {
    // The browser is mid-redirect from the gateway: send it to the failure
    // page instead of leaving it on a raw JSON error.
    if (err instanceof ApiError) {
      redirectWith(res, config.ssl.fail_frontend_url, transactionId, 'Payment could not be verified');
      return;
    }
    throw err;
  }
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const params = callbackParams(req);
  await PaymentService.handlePaymentFail(params);
  redirectWith(
    res,
    config.ssl.fail_frontend_url,
    String(params.tran_id || params.transactionId || ''),
    'Payment Failed',
  );
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const params = callbackParams(req);
  await PaymentService.handlePaymentCancel(params);
  redirectWith(
    res,
    config.ssl.cancel_frontend_url,
    String(params.tran_id || params.transactionId || ''),
    'Payment Cancelled',
  );
});

const validateIPN = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
  const result = await PaymentService.handleIPNValidation(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment IPN validated successfully',
    data: result,
  });
});

export const PaymentController = {
  initRecharge,
  successPayment,
  failPayment,
  cancelPayment,
  validateIPN,
};
