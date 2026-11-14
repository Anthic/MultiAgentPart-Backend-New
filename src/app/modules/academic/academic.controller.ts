import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { AcademicService } from './academic.service';

const requireUser = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  return userId;
};

const handler = (
  message: string,
  run: (userId: string, body: any) => Promise<unknown>,
) =>
  catchAsync(async (req: Request, res: Response) => {
    const data = await run(requireUser(req), req.body);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message, data });
  });

export const AcademicController = {
  peerReview: handler('Peer review completed', AcademicService.peerReview),
  generateSlides: handler('Slides generated', AcademicService.generateSlides),
  findGaps: handler('Gap analysis completed', AcademicService.findGaps),
  draftSection: handler('Section drafted', AcademicService.draftSection),
};
