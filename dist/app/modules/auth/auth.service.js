"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_1 = __importDefault(require("http-status"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const auth_model_1 = require("./auth.model");
const user_model_1 = require("../user/user.model");
const config_1 = __importDefault(require("../../../config"));
const passwordUtils_1 = require("../../utils/passwordUtils");
const createTokens = (payload) => {
    const accessToken = jwtHelpers_1.jwtHelpers.createToken(payload, config_1.default.jwt.access_secret, (config_1.default.jwt.access_expires_in || '15m'));
    const refreshToken = jwtHelpers_1.jwtHelpers.createToken(payload, config_1.default.jwt.refresh_secret, (config_1.default.jwt.refresh_expires_in || '7d'));
    return { accessToken, refreshToken };
};
const registerUser = async (payload) => {
    const { name, email, password } = payload;
    const { isValid, errors } = (0, passwordUtils_1.validatePasswordComplexity)(password);
    if (!isValid)
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, errors.join(', '));
    const existingUser = await auth_model_1.AuthUser.findOne({ email });
    if (existingUser) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, 'User already exists');
    }
    const userId = (0, crypto_1.randomUUID)();
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const authUser = await auth_model_1.AuthUser.create([{ userId, email, password, role: 'user' }], { session });
        await auth_model_1.AuthUser.findByIdAndUpdate(authUser[0]._id, { $push: { passwordHistory: authUser[0].password } }, { session });
        await user_model_1.User.create([{ id: userId, name, email, role: authUser[0].role }], { session });
        await session.commitTransaction();
        const tokens = createTokens({
            userId: authUser[0].userId,
            role: authUser[0].role,
            email: authUser[0].email,
        });
        return {
            ...tokens,
            user: {
                userId: authUser[0].userId,
                name,
                email: authUser[0].email,
                role: authUser[0].role,
            },
        };
    }
    catch (err) {
        await session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
};
const loginUser = async (payload) => {
    const { email, password } = payload;
    const authUser = await auth_model_1.AuthUser.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!authUser) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User does not exist');
    }
    if (authUser.isLocked()) {
        const remainingTime = Math.ceil((authUser.lockUntil.getTime() - Date.now()) / 60000);
        throw new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, `Account locked. Try again in ${remainingTime} minutes`);
    }
    const isPasswordMatched = await bcryptjs_1.default.compare(password, authUser.password);
    if (!isPasswordMatched) {
        await authUser.incrementLoginAttempts();
        const updatedUser = await auth_model_1.AuthUser.findById(authUser._id).select('+loginAttempts +lockUntil');
        if (updatedUser?.isLocked()) {
            throw new ApiError_1.default(http_status_1.default.TOO_MANY_REQUESTS, 'Account locked due to too many failed attempts');
        }
        const remaining = config_1.default.account_lock.max_attempts - updatedUser.loginAttempts;
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, `Invalid credentials. ${remaining} attempts remaining`);
    }
    await authUser.resetLoginAttempts();
    const userProfile = await user_model_1.User.findOne({ id: authUser.userId });
    const tokens = createTokens({
        userId: authUser.userId,
        role: authUser.role,
        email: authUser.email,
    });
    const hashedRT = await bcryptjs_1.default.hash(tokens.refreshToken, 10);
    await auth_model_1.AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: hashedRT });
    return {
        ...tokens,
        user: {
            userId: authUser.userId,
            name: userProfile?.name || '',
            email: authUser.email,
            role: authUser.role,
        },
    };
};
const refreshToken = async (token) => {
    const verified = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.refresh_secret);
    if (!verified?.userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid refresh token');
    }
    const authUser = await auth_model_1.AuthUser.findOne({ userId: verified.userId }).select('+refreshToken');
    if (!authUser || !authUser.refreshToken) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Please login again');
    }
    const isMatch = await bcryptjs_1.default.compare(token, authUser.refreshToken);
    if (!isMatch) {
        await auth_model_1.AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: null });
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Token reuse detected. Please login again');
    }
    const newTokens = createTokens({
        userId: authUser.userId,
        role: authUser.role,
        email: authUser.email,
    });
    const newHashedRT = await bcryptjs_1.default.hash(newTokens.refreshToken, 10);
    await auth_model_1.AuthUser.findByIdAndUpdate(authUser._id, { refreshToken: newHashedRT });
    return newTokens;
};
const logoutUser = async (userId) => {
    await auth_model_1.AuthUser.findOneAndUpdate({ userId }, { refreshToken: null });
};
exports.AuthService = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
};
//# sourceMappingURL=auth.service.js.map