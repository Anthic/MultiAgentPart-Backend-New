import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import ApiError from '../../errors/ApiError';
import { NoteService } from './note.service';

const createNote = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await NoteService.createNote(req.body, userId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Note saved to vault successfully',
    data: result,
  });
});

const getAllNotes = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const { tag, search } = req.query;
  const result = await NoteService.getAllNotes(userId, {
    tag: tag as string,
    search: search as string,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notes retrieved successfully',
    data: result,
  });
});

const getSingleNote = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await NoteService.getSingleNote(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Note retrieved successfully',
    data: result,
  });
});

const updateNote = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await NoteService.updateNote(id, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Note updated successfully',
    data: result,
  });
});

const deleteNote = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { id } = req.params as { id: string };
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await NoteService.deleteNote(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Note removed from vault successfully',
    data: result,
  });
});

const getAllTags = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized');

  const result = await NoteService.getAllTags(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Tags retrieved successfully',
    data: result,
  });
});

export const NoteController = {
  createNote,
  getAllNotes,
  getSingleNote,
  updateNote,
  deleteNote,
  getAllTags,
};
