"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const payment_service_1 = require("./payment.service");
const initRecharge = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { amountBDT, paymentType } = req.body;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await payment_service_1.PaymentService.initRechargePayment(userId, Number(amountBDT), paymentType);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'SSLCommerz payment initialized successfully',
        data: result,
    });
});
const successPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await payment_service_1.PaymentService.handlePaymentSuccess(query);
    res.redirect(`${config_1.default.ssl.success_frontend_url}&transactionId=${query.transactionId}&message=${encodeURIComponent(result.message)}`);
});
const failPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    await payment_service_1.PaymentService.handlePaymentFail(query);
    res.redirect(`${config_1.default.ssl.fail_frontend_url}&transactionId=${query.transactionId}&message=Payment%20Failed`);
});
const cancelPayment = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    await payment_service_1.PaymentService.handlePaymentCancel(query);
    res.redirect(`${config_1.default.ssl.cancel_frontend_url}&transactionId=${query.transactionId}&message=Payment%20Cancelled`);
});
const validateIPN = (0, catchAsync_1.default)(async (req, res) => {
    const payload = req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
    const result = await payment_service_1.PaymentService.handleIPNValidation(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Payment IPN validated successfully',
        data: result,
    });
});
exports.PaymentController = {
    initRecharge,
    successPayment,
    failPayment,
    cancelPayment,
    validateIPN,
};
//# sourceMappingURL=payment.controller.js.map