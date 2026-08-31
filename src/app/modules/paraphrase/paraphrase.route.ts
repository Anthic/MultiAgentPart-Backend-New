import express from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ParaphraseController } from './paraphrase.controller';
import { ParaphraseValidation } from './paraphrase.validation';

const router = express.Router();

router.post(
  '/',
  auth.authenticate,
  validateRequest(ParaphraseValidation.createParaphraseSchema),
  ParaphraseController.paraphraseText,
);

router.post(
  '/estimate',
  auth.authenticate,
  ParaphraseController.estimateCost,
);

router.get(
  '/history',
  auth.authenticate,
  ParaphraseController.getParaphraseHistory,
);

export const ParaphraseRoutes = router;
