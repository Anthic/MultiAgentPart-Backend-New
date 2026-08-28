Folder structure
src/
└── app/
    ├── config/
    │   └── env.ts
    ├── errorHelpers/
    │   └── AppError.ts
    ├── utils/
    │   ├── catchAsync.ts
    │   ├── getTransactionId.ts
    │   └── sendResponse.ts
    ├── modules/
    │   ├── sslCommerz/
    │   │   ├── sslCommerz.interface.ts
    │   │   └── sslCommerz.service.ts
    │   ├── payment/
    │   │   ├── payment.interface.ts
    │   │   ├── payment.model.ts
    │   │   ├── payment.service.ts
    │   │   ├── payment.controller.ts
    │   │   └── payment.route.ts
    │   └── booking/
    │       └── booking.service.ts
    └── routes/
        └── index.ts

.env Configuration

SSL_STORE_ID=your_store_id
SSL_STORE_PASS=your_store_password

SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php

SSL_SUCCESS_BACKEND_URL=https://your-api.com/api/v1/payment/success
SSL_FAIL_BACKEND_URL=https://your-api.com/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=https://your-api.com/api/v1/payment/cancel
SSL_IPN_URL=https://your-api.com/api/v1/payment/validate-payment

SSL_SUCCESS_FRONTEND_URL=http://localhost:5173/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:5173/payment/fail
SSL_CANCEL_FRONTEND_URL=http://localhost:5173/payment/cancel

4. SSL Interface
export interface ISSLCommerz {
    amount: number;
    transactionId: string;
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
}

5. SSL Service
import axios from "axios";
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { Payment } from "../payment/payment.model";
import { ISSLCommerz } from "./sslCommerz.interface";

const sslPaymentInit = async (payload: ISSLCommerz) => {
    try {
        const paymentData = {
            store_id: envVars.SSL.STORE_ID,
            store_passwd: envVars.SSL.STORE_PASS,
            total_amount: payload.amount,
            currency: "BDT",
            tran_id: payload.transactionId,

            success_url: `${envVars.SSL.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=success`,
            fail_url: `${envVars.SSL.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=fail`,
            cancel_url: `${envVars.SSL.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&amount=${payload.amount}&status=cancel`,

            ipn_url: envVars.SSL.SSL_IPN_URL,

            shipping_method: "NO",
            product_name: "Product",
            product_category: "Service",
            product_profile: "general",

            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_add2: "N/A",
            cus_city: "Dhaka",
            cus_state: "Dhaka",
            cus_postcode: "1000",
            cus_country: "Bangladesh",
            cus_phone: payload.phoneNumber,
            cus_fax: "N/A",

            ship_name: payload.name,
            ship_add1: payload.address,
            ship_add2: "N/A",
            ship_city: "Dhaka",
            ship_state: "Dhaka",
            ship_postcode: "1000",
            ship_country: "Bangladesh",
        };

        const response = await axios.post(
            envVars.SSL.SSL_PAYMENT_API,
            paymentData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return response.data;
    } catch (error: any) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            error.message || "SSLCommerz payment initialization failed"
        );
    }
};

const validatePayment = async (payload: any) => {
    try {
        const response = await axios.get(
            `${envVars.SSL.SSL_VALIDATION_API}?val_id=${payload.val_id}&store_id=${envVars.SSL.STORE_ID}&store_passwd=${envVars.SSL.STORE_PASS}&format=json`
        );

        await Payment.findOneAndUpdate(
            { transactionId: payload.tran_id },
            {
                paymentGatewayData: response.data,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        return response.data;
    } catch (error: any) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Payment validation failed: ${error.message}`
        );
    }
};

export const SSLService = {
    sslPaymentInit,
    validatePayment,
};

6. Payment Interface

import { Types } from "mongoose";

export enum PAYMENT_STATUS {
    PAID = "PAID",
    UNPAID = "UNPAID",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
}

export interface IPayment {
    booking: Types.ObjectId;
    transactionId: string;
    amount: number;
    status: PAYMENT_STATUS;
    paymentGatewayData?: Record<string, unknown>;
}
7. Payment Model
import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID,
        },
        paymentGatewayData: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

export const Payment = model<IPayment>("Payment", paymentSchema);

8. Transaction ID Utility
export const getTransactionId = () => {
    return `tran_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

9. Payment Service-এর মূল অংশ
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { Payment } from "./payment.model";

const initPayment = async (bookingId: string) => {
    const payment = await Payment.findOne({
        booking: bookingId,
        status: "UNPAID",
    }).populate({
        path: "booking",
        populate: {
            path: "user",
        },
    });

    if (!payment) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            "Unpaid payment not found"
        );
    }

    const booking: any = payment.booking;
    const user: any = booking.user;

    const sslPayment = await SSLService.sslPaymentInit({
        amount: payment.amount,
        transactionId: payment.transactionId,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone,
        address: user.address,
    });

    return {
        paymentUrl: sslPayment.GatewayPageURL,
    };
};

export const PaymentService = {
    initPayment,
};
Payment success/fail/cancel callback-এ আপনার entity status update করবেন:
const successPayment = async (query: Record<string, string>) => {
    const payment = await Payment.findOneAndUpdate(
        {
            transactionId: query.transactionId,
            status: "UNPAID",
        },
        {
            status: "PAID",
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!payment) {
        throw new AppError(404, "Payment not found");
    }

    // এখানে আপনার booking/order status update করবেন

    return {
        success: true,
        message: "Payment completed successfully",
    };
};

const failPayment = async (query: Record<string, string>) => {
    await Payment.findOneAndUpdate(
        { transactionId: query.transactionId },
        { status: "FAILED" },
        { runValidators: true }
    );

    return {
        success: false,
        message: "Payment failed",
    };
};

const cancelPayment = async (query: Record<string, string>) => {
    await Payment.findOneAndUpdate(
        { transactionId: query.transactionId },
        { status: "CANCELLED" },
        { runValidators: true }
    );

    return {
        success: false,
        message: "Payment cancelled",
    };
};
10. Payment Controller
import { Request, Response } from "express";
import { envVars } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PaymentService } from "./payment.service";

const initPayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.initPayment(
        req.params.bookingId
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment initialized successfully",
        data: result,
    });
});

const successPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const result = await PaymentService.successPayment(query);

    res.redirect(
        `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&status=success`
    );
});

const failPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const result = await PaymentService.failPayment(query);

    res.redirect(
        `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&status=fail`
    );
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const result = await PaymentService.cancelPayment(query);

    res.redirect(
        `${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&status=cancel`
    );
});

const validatePayment = catchAsync(async (req: Request, res: Response) => {
    const result = await SSLService.validatePayment(req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment validated successfully",
        data: result,
    });
});

export const PaymentController = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    validatePayment,
};
11. Payment Routes
import express from "express";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post(
    "/init-payment/:bookingId",
    PaymentController.initPayment
);

router.post(
    "/success",
    PaymentController.successPayment
);

router.post(
    "/fail",
    PaymentController.failPayment
);

router.post(
    "/cancel",
    PaymentController.cancelPayment
);

router.post(
    "/validate-payment",
    PaymentController.validatePayment
);

export const PaymentRoutes = router;

12. Main Route-এ Register
import { PaymentRoutes } from "../modules/payment/payment.route";

router.use("/payment", PaymentRoutes);

13. Express Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
14. Booking বা Order তৈরির সময় Payment তৈরি
const transactionId = getTransactionId();

const payment = await Payment.create({
    booking: booking._id,
    transactionId,
    amount: totalAmount,
    status: PAYMENT_STATUS.UNPAID,
});

booking.payment = payment._id;
await booking.save();