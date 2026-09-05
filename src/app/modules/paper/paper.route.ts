import express from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaperController } from './paper.controller';
import { PaperValidation } from './paper.validation';

const router = express.Router();

router.post(
  '/',
  auth.authenticate,
  validateRequest(PaperValidation.createPaperSchema),
  PaperController.createPaper,
);

router.get('/', auth.authenticate, PaperController.getAllPapers);
router.get('/:id', auth.authenticate, PaperController.getSinglePaper);

router.patch(
  '/:id',
  auth.authenticate,
  validateRequest(PaperValidation.updatePaperSchema),
  PaperController.updatePaper,
);

router.delete('/:id', auth.authenticate, PaperController.deletePaper);

router.post(
  '/:id/citations',
  auth.authenticate,
  PaperController.addCitation,
);
router.post('/:id/defense/questions', auth.authenticate, PaperController.getDefenseQuestions);
router.post('/:id/defense/evaluate', auth.authenticate, PaperController.evaluateDefenseRebuttal);

export const PaperRoutes = router;
