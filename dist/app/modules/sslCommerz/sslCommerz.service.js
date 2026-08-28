"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSLService = void 0;
const axios_1 = __importDefault(require("axios"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const sslPaymentInit = async (payload) => {
    try {
        const paymentData = {
            store_id: config_1.default.ssl.store_id,
            store_passwd: config_1.default.ssl.store_pass,
            total_amount: payload.amount,
            currency: 'BDT',
            tran_id: payload.transactionId,
            success_url: `${config_1.default.ssl.success_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
            fail_url: `${config_1.default.ssl.fail_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
            cancel_url: `${config_1.default.ssl.cancel_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
            ipn_url: config_1.default.ssl.ipn_url,
            shipping_method: 'NO',
            product_name: 'AtlashAI Credits Topup',
            product_category: 'AI Research Credits',
            product_profile: 'non-physical-goods',
            cus_name: payload.name || 'AtlashAI Researcher',
            cus_email: payload.email || 'researcher@atlashai.com',
            cus_add1: payload.address || 'Dhaka, Bangladesh',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1200',
            cus_country: 'Bangladesh',
            cus_phone: payload.phoneNumber || '01700000000',
        };
        const params = new URLSearchParams();
        Object.entries(paymentData).forEach(([key, val]) => {
            params.append(key, String(val));
        });
        const response = await axios_1.default.post(config_1.default.ssl.payment_api, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log('[SSLCommerz Init Response]', response.data);
        if (response.data?.status === 'SUCCESS' && response.data?.GatewayPageURL) {
            return response.data.GatewayPageURL;
        }
        const failedReason = response.data?.failedreason ||
            response.data?.message ||
            response.data?.status ||
            JSON.stringify(response.data) ||
            'SSLCommerz Gateway initialization failed';
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `SSLCommerz Error: ${failedReason}`);
    }
    catch (error) {
        console.error('[SSLCommerz Exception]', error.response?.data || error.message);
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, error.response?.data?.failedreason || error.message || 'SSLCommerz initialization failed');
    }
};
const validatePayment = async (val_id) => {
    try {
        const response = await axios_1.default.get(`${config_1.default.ssl.validation_api}?val_id=${val_id}&store_id=${config_1.default.ssl.store_id}&store_passwd=${config_1.default.ssl.store_pass}&format=json`);
        return response.data;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Payment validation failed: ${error.message}`);
    }
};
exports.SSLService = {
    sslPaymentInit,
    validatePayment,
};
//# sourceMappingURL=sslCommerz.service.js.map