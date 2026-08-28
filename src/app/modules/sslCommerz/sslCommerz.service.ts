import axios from 'axios';
import httpStatus from 'http-status';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import { ISSLPaymentPayload } from './sslCommerz.interface';

const sslPaymentInit = async (payload: ISSLPaymentPayload): Promise<string> => {
  try {
    const paymentData = {
      store_id: config.ssl.store_id,
      store_passwd: config.ssl.store_pass,
      total_amount: payload.amount,
      currency: 'BDT',
      tran_id: payload.transactionId,

      success_url: `${config.ssl.success_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
      fail_url: `${config.ssl.fail_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
      cancel_url: `${config.ssl.cancel_backend_url}?transactionId=${payload.transactionId}&amount=${payload.amount}`,
      ipn_url: config.ssl.ipn_url,

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

    const response = await axios.post(config.ssl.payment_api, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('[SSLCommerz Init Response]', response.data);

    if (response.data?.status === 'SUCCESS' && response.data?.GatewayPageURL) {
      return response.data.GatewayPageURL;
    }

    const failedReason =
      response.data?.failedreason ||
      response.data?.message ||
      response.data?.status ||
      JSON.stringify(response.data) ||
      'SSLCommerz Gateway initialization failed';

    throw new ApiError(httpStatus.BAD_REQUEST, `SSLCommerz Error: ${failedReason}`);
  } catch (error: any) {
    console.error('[SSLCommerz Exception]', error.response?.data || error.message);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.response?.data?.failedreason || error.message || 'SSLCommerz initialization failed',
    );
  }
};

const validatePayment = async (val_id: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${config.ssl.validation_api}?val_id=${val_id}&store_id=${config.ssl.store_id}&store_passwd=${config.ssl.store_pass}&format=json`,
    );

    return response.data;
  } catch (error: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Payment validation failed: ${error.message}`,
    );
  }
};

export const SSLService = {
  sslPaymentInit,
  validatePayment,
};
