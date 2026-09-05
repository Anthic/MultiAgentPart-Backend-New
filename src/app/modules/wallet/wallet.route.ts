import express from 'express';
import { auth } from '../../middlewares/auth';
import { WalletController } from './wallet.controller';

const router = express.Router();

router.get('/balance', auth.authenticate, WalletController.getMyWallet);
router.get('/logs', auth.authenticate, WalletController.getAuditLogs);
router.post(
  '/add-funds',
  auth.authenticate,
  auth.authorize('admin'),
  WalletController.addFunds,
);

export const WalletRoutes = router;
