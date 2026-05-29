"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtHelpers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createToken = (payload, secret, expiresIn) => {
    const options = expiresIn ? { expiresIn } : {};
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.jwtHelpers = {
    createToken,
    verifyToken,
};
//# sourceMappingURL=jwtHelpers.js.map