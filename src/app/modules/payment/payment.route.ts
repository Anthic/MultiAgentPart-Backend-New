import express from 'express';
import { auth } from '../../middlewares/auth';
import { PaymentController } from './payment.controller';

const router = express.Router();


router.post('/init-recharge', auth.authenticate, PaymentController.initRecharge);


router.post('/success', PaymentController.successPayment);
router.post('/fail', PaymentController.failPayment);
router.post('/cancel', PaymentController.cancelPayment);
router.post('/ipn', PaymentController.validateIPN);

export const PaymentRoutes = router;
