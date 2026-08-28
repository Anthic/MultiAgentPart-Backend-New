"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const note_model_1 = require("./note.model");
const createNote = async (payload, userId) => {
    const result = await note_model_1.Note.create({ ...payload, userId });
    return result;
};
const getAllNotes = async (userId, query) => {
    const filter = { userId };
    if (query.tag) {
        filter.tags = query.tag.toLowerCase();
    }
    if (query.search) {
        filter.$text = { $search: query.search };
    }
    const result = await note_model_1.Note.find(filter).sort({
        updatedAt: -1
    });
    return result;
};
const getSingleNote = async (id, userId) => {
    const result = await note_model_1.Note.findOne({ _id: id, userId });
    if (!result) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Note not found');
    }
    return result;
};
const updateNote = async (id, userId, payload) => {
    const isExist = await note_model_1.Note.findOne({ _id: id, userId });
    if (!isExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Note not found');
    }
    const result = await note_model_1.Note.findOneAndUpdate({ _id: id, userId }, payload, { new: true, runValidators: true });
    return result;
};
const deleteNote = async (id, userId) => {
    const isExist = await note_model_1.Note.findOne({ _id: id, userId });
    if (!isExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Note not found');
    }
    const result = await note_model_1.Note.findOneAndDelete({ _id: id, userId });
    return result;
};
const getAllTags = async (userId) => {
    const tags = await note_model_1.Note.distinct('tags', { userId });
    return tags;
};
exports.NoteService = {
    createNote,
    getAllNotes,
    getSingleNote,
    updateNote,
    deleteNote,
    getAllTags,
};
//# sourceMappingURL=note.service.js.map