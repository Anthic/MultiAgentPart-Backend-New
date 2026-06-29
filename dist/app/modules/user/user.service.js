"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const crypto_1 = require("crypto");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const auth_model_1 = require("../auth/auth.model");
const user_model_1 = require("./user.model");
const createUserByAdmin = async (payload) => {
    const { name, email, password, role } = payload;
    const existingUser = await auth_model_1.AuthUser.findOne({ email });
    if (existingUser) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'User already exists');
    }
    const userId = (0, crypto_1.randomUUID)();
    const authUser = await auth_model_1.AuthUser.create({
        userId,
        email,
        password,
        role: role || 'user',
    });
    const createdUser = await user_model_1.User.create({
        id: userId,
        name,
        email,
        role: authUser.role,
    });
    return createdUser.toObject();
};
const getAllUsers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        user_model_1.User.find().skip(skip).limit(limit),
        user_model_1.User.countDocuments(),
    ]);
    return {
        data: users,
        meta: {
            page,
            limit,
            total,
        },
    };
};
const getUserById = async (userId) => {
    const user = (await user_model_1.User.findOne({ id: userId }));
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
};
const deleteUserById = async (userId) => {
    const user = await user_model_1.User.findOne({ id: userId });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    await auth_model_1.AuthUser.deleteOne({ userId });
    await user_model_1.User.deleteOne({ id: userId });
};
const getMe = async (userId) => {
    const user = (await user_model_1.User.findOne({ id: userId }));
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return user;
};
const updateMe = async (userId, payload) => {
    if (payload.email) {
        const existingAuthUser = await auth_model_1.AuthUser.findOne({
            email: payload.email,
            userId: { $ne: userId },
        });
        if (existingAuthUser) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, 'Email already in use');
        }
        await auth_model_1.AuthUser.updateOne({ userId }, { email: payload.email });
    }
    const updatedUser = await user_model_1.User.findOneAndUpdate({ id: userId }, payload, {
        new: true,
    });
    if (!updatedUser) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return updatedUser;
};
exports.UserService = {
    createUserByAdmin,
    getAllUsers,
    getUserById,
    deleteUserById,
    getMe,
    updateMe,
};
//# sourceMappingURL=user.service.js.map