import express from 'express';
import { auth } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AcademicController } from './academic.controller';
import { AcademicValidation } from './academic.validation';

const router = express.Router();

router.post('/peer-review', auth.authenticate, validateRequest(AcademicValidation.peerReviewSchema), AcademicController.peerReview);
router.post('/generate-slides', auth.authenticate, validateRequest(AcademicValidation.slidesSchema), AcademicController.generateSlides);
router.post('/gap-finder', auth.authenticate, validateRequest(AcademicValidation.gapFinderSchema), AcademicController.findGaps);
router.post('/vault/draft-section', auth.authenticate, validateRequest(AcademicValidation.draftSectionSchema), AcademicController.draftSection);

export const AcademicRoutes = router;
