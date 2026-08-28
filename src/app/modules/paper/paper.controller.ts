import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { PaperService } from './paper.service';

const createPaper = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.createPaper(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Paper created successfully',
    data: result,
  });
});

const getAllPapers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.getAllPapers(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Papers retrieved successfully',
    data: result,
  });
});

const getSinglePaper = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.getSinglePaper(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Paper retrieved successfully',
    data: result,
  });
});

const updatePaper = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.updatePaper(id, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Paper updated successfully',
    data: result,
  });
});

const deletePaper = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.deletePaper(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Paper deleted successfully',
    data: result,
  });
});

const addCitation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await PaperService.addCitation(id, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Citation added to paper successfully',
    data: result,
  });
});

export const PaperController = {
  createPaper,
  getAllPapers,
  getSinglePaper,
  updatePaper,
  deletePaper,
  addCitation,
};
