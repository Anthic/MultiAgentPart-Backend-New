"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUser = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = __importDefault(require("../../../config"));
const authUserSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    refreshToken: { type: String, select: false, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    passwordHistory: { type: [String], select: false, default: [] },
}, {
    timestamps: true,
    versionKey: false,
});
authUserSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        delete ret._id;
        return ret;
    },
});
authUserSchema.pre('save', async function () {
    if (!this.isModified('password'))
        return;
    const user = this;
    user.password = await bcryptjs_1.default.hash(user.password, Number(config_1.default.bcrypt_salt_rounds));
});
authUserSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
};
authUserSchema.methods.incrementLoginAttempts =
    async function () {
        if (this.lockUntil && this.lockUntil < new Date()) {
            await this.updateOne({
                $set: { loginAttempts: 1 },
                $unset: { lockUntil: 1 },
            });
            return;
        }
        const update = { $inc: { loginAttempts: 1 } };
        if (this.loginAttempts + 1 >= config_1.default.account_lock.max_attempts) {
            update.$set = {
                lockUntil: new Date(Date.now() + config_1.default.account_lock.duration_ms),
            };
        }
        await this.updateOne(update);
    };
authUserSchema.methods.resetLoginAttempts = async function () {
    await this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
    });
};
exports.AuthUser = (0, mongoose_1.model)('AuthUser', authUserSchema);
//# sourceMappingURL=auth.model.js.map