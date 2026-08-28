"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const getTransactionId_1 = require("../../utils/getTransactionId");
const sslCommerz_service_1 = require("../sslCommerz/sslCommerz.service");
const wallet_service_1 = require("../wallet/wallet.service");
const user_model_1 = require("../user/user.model");
const payment_interface_1 = require("./payment.interface");
const payment_model_1 = require("./payment.model");
const initRechargePayment = async (userId, amountBDT, paymentType = 'wallet_topup') => {
    if (amountBDT < 10) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Minimum recharge amount is ৳10 BDT');
    }
    let user = null;
    try {
        user = await user_model_1.User.findOne({ $or: [{ id: userId }, { _id: userId }] });
    }
    catch {
        user = await user_model_1.User.findOne({ id: userId });
    }
    const transactionId = (0, getTransactionId_1.getTransactionId)();
    await payment_model_1.Payment.create({
        userId,
        transactionId,
        amountBDT,
        paymentType,
        status: payment_interface_1.PAYMENT_STATUS.UNPAID,
    });
    const paymentUrl = await sslCommerz_service_1.SSLService.sslPaymentInit({
        amount: amountBDT,
        transactionId,
        name: user?.name || 'AtlashAI User',
        email: user?.email || 'user@atlashai.com',
    });
    return { paymentUrl, transactionId };
};
const handlePaymentSuccess = async (query) => {
    const { transactionId } = query;
    const payment = await payment_model_1.Payment.findOne({ transactionId });
    if (!payment) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Payment record not found');
    }
    if (payment.status === payment_interface_1.PAYMENT_STATUS.PAID) {
        return { success: true, message: 'Payment already processed' };
    }
    payment.status = payment_interface_1.PAYMENT_STATUS.PAID;
    await payment.save();
    await wallet_service_1.WalletService.addFundsToWallet(payment.userId, payment.amountBDT);
    return { success: true, message: `Successfully recharged ৳${payment.amountBDT} to your wallet!` };
};
const handlePaymentFail = async (query) => {
    const { transactionId } = query;
    await payment_model_1.Payment.findOneAndUpdate({ transactionId }, { status: payment_interface_1.PAYMENT_STATUS.FAILED });
    return { success: false, message: 'Payment failed' };
};
const handlePaymentCancel = async (query) => {
    const { transactionId } = query;
    await payment_model_1.Payment.findOneAndUpdate({ transactionId }, { status: payment_interface_1.PAYMENT_STATUS.CANCELLED });
    return { success: false, message: 'Payment cancelled by user' };
};
const handleIPNValidation = async (body) => {
    const payload = body || {};
    const val_id = payload.val_id || payload.valId;
    const tran_id = payload.tran_id || payload.tranId || payload.transactionId;
    if (!val_id || !tran_id) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid IPN data: val_id and tran_id are required');
    }
    const validationData = await sslCommerz_service_1.SSLService.validatePayment(val_id);
    if (validationData.status === 'VALID' || validationData.status === 'VALIDATED') {
        const payment = await payment_model_1.Payment.findOne({ transactionId: tran_id });
        if (payment && payment.status !== payment_interface_1.PAYMENT_STATUS.PAID) {
            payment.status = payment_interface_1.PAYMENT_STATUS.PAID;
            payment.paymentGatewayData = validationData;
            await payment.save();
            await wallet_service_1.WalletService.addFundsToWallet(payment.userId, payment.amountBDT);
        }
    }
    return { success: true, data: validationData };
};
exports.PaymentService = {
    initRechargePayment,
    handlePaymentSuccess,
    handlePaymentFail,
    handlePaymentCancel,
    handleIPNValidation,
};
//# sourceMappingURL=payment.service.js.map