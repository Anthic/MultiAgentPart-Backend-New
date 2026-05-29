"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
}, {
    timestamps: true,
    versionKey: false,
});
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (_doc, ret) {
        delete ret._id;
        return ret;
    },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map