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

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.query, ...req.body } as Record<string, string>;
  const result = await PaymentService.handlePaymentSuccess(payload);
  const transactionId = payload.tran_id || payload.transactionId
  res.redirect(
    `${config.ssl.success_frontend_url}&transactionId=${transactionId}&message=${encodeURIComponent(result.message)}`,
  );
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  await PaymentService.handlePaymentFail(query);

  res.redirect(
    `${config.ssl.fail_frontend_url}&transactionId=${query.transactionId}&message=Payment%20Failed`,
  );
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  await PaymentService.handlePaymentCancel(query);

  res.redirect(
    `${config.ssl.cancel_frontend_url}&transactionId=${query.transactionId}&message=Payment%20Cancelled`,
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
