"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const payment_interface_1 = require("./payment.interface");
const paymentSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    amountBDT: { type: Number, required: true },
    paymentType: {
        type: String,
        enum: ['wallet_topup', 'subscription_pro'],
        default: 'wallet_topup',
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PAYMENT_STATUS),
        default: payment_interface_1.PAYMENT_STATUS.UNPAID,
    },
    paymentGatewayData: { type: mongoose_1.Schema.Types.Mixed },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Payment = (0, mongoose_1.model)('Payment', paymentSchema);
//# sourceMappingURL=payment.model.js.map