"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const paper_model_1 = require("./paper.model");
const createPaper = async (payload, userId) => {
    const result = await paper_model_1.Paper.create({
        ...payload,
        userId
    });
    return result;
};
const getAllPapers = async (userId) => {
    const result = await paper_model_1.Paper.find({ userId }).sort({ updatedAt: -1 });
    return result;
};
const getSinglePaper = async (id, userId) => {
    const result = await paper_model_1.Paper.findOne({
        userId, _id: id
    });
    if (!result) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Paper not found");
    }
    return result;
};
const updatePaper = async (id, userId, payload) => {
    const isExist = await paper_model_1.Paper.findOne({
        _id: id,
        userId
    });
    if (!isExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Paper not found");
    }
    const result = await paper_model_1.Paper.findOneAndUpdate({ _id: id, userId }, payload, { new: true, runValidators: true });
    return result;
};
const deletePaper = async (id, userId) => {
    const isExist = await paper_model_1.Paper.findOne({ _id: id, userId });
    if (!isExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Paper not found');
    }
    const result = await paper_model_1.Paper.findOneAndDelete({ _id: id, userId });
    return result;
};
const addCitation = async (id, userId, citation) => {
    const paper = await paper_model_1.Paper.findOne({ _id: id, userId });
    if (!paper) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Paper not found');
    }
    paper.citations.push(citation);
    await paper.save();
    return paper;
};
exports.PaperService = {
    createPaper,
    getAllPapers,
    getSinglePaper,
    updatePaper,
    deletePaper,
    addCitation,
};
//# sourceMappingURL=paper.service.js.map