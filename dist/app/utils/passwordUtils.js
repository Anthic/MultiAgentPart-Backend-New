"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimPasswordHistory = exports.isPasswordHistory = exports.validatePasswordComplexity = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validatePasswordComplexity = (password) => {
    const errors = [];
    if (password.length < 8)
        errors.push('Minimum 8 characters');
    if (!/[A-Z]/.test(password))
        errors.push('One uppercase letter');
    if (!/[a-z]/.test(password))
        errors.push('One lowercase letter');
    if (!/[0-9]/.test(password))
        errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        errors.push('One special character');
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validatePasswordComplexity = validatePasswordComplexity;
const isPasswordHistory = async (newPassword, history) => {
    for (const oldHashedPassword of history) {
        const isMatch = await bcryptjs_1.default.compare(newPassword, oldHashedPassword);
        if (isMatch) {
            return true;
        }
    }
    return false;
};
exports.isPasswordHistory = isPasswordHistory;
const trimPasswordHistory = (history, max = 5) => {
    return history.slice(-max);
};
exports.trimPasswordHistory = trimPasswordHistory;
//# sourceMappingURL=passwordUtils.js.map