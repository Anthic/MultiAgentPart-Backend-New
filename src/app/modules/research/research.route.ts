import express from 'express';
import { ResearchController } from './research.controller';
import { auth } from '../../middlewares/auth';

import { ResearchValidation } from './research.validation';
import validateRequest from '../../middlewares/validateRequest';
import { aiRequestLimiter } from '../../middlewares/rateLimiter';

const router = express.Router();

// Agent Management
router.get('/health', ResearchController.getAgentHealth);
router.get('/cache-stats', auth.authenticate, ResearchController.getCacheStats);
// Research Operations
router.post(
  '/',
  auth.authenticate,
  validateRequest(ResearchValidation.startResearchSchema),
  aiRequestLimiter,
  ResearchController.startResearch,
);
router.get('/quota', auth.authenticate, ResearchController.getResearchQuota);
router.get('/job/:jobId', auth.authenticate, ResearchController.getJobStatus);
// History
router.get(
  '/history',
  auth.authenticate,
  ResearchController.getResearchHistory,
);
router.get(
  '/history/:id',
  auth.authenticate,
  ResearchController.getHistoryById,
);

export const ResearchRoutes = router;
