"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middlewares/auth");
const payment_controller_1 = require("./payment.controller");
const router = express_1.default.Router();
router.post('/init-recharge', auth_1.auth.authenticate, payment_controller_1.PaymentController.initRecharge);
router.post('/success', payment_controller_1.PaymentController.successPayment);
router.post('/fail', payment_controller_1.PaymentController.failPayment);
router.post('/cancel', payment_controller_1.PaymentController.cancelPayment);
router.post('/ipn', payment_controller_1.PaymentController.validateIPN);
exports.PaymentRoutes = router;
//# sourceMappingURL=payment.route.js.map