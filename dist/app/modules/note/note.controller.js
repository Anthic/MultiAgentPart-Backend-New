"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const note_service_1 = require("./note.service");
const createNote = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await note_service_1.NoteService.createNote(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Note saved to vault successfully',
        data: result,
    });
});
const getAllNotes = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const { tag, search } = req.query;
    const result = await note_service_1.NoteService.getAllNotes(userId, {
        tag: tag,
        search: search,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Notes retrieved successfully',
        data: result,
    });
});
const getSingleNote = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await note_service_1.NoteService.getSingleNote(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Note retrieved successfully',
        data: result,
    });
});
const updateNote = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await note_service_1.NoteService.updateNote(id, userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Note updated successfully',
        data: result,
    });
});
const deleteNote = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await note_service_1.NoteService.deleteNote(id, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Note removed from vault successfully',
        data: result,
    });
});
const getAllTags = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Unauthorized');
    const result = await note_service_1.NoteService.getAllTags(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Tags retrieved successfully',
        data: result,
    });
});
exports.NoteController = {
    createNote,
    getAllNotes,
    getSingleNote,
    updateNote,
    deleteNote,
    getAllTags,
};
//# sourceMappingURL=note.controller.js.map