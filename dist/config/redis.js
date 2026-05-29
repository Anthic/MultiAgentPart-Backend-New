"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const _1 = __importDefault(require("."));
exports.redis = new ioredis_1.default({
    host: _1.default.redisConnection.host,
    port: 6379,
    password: _1.default.redisConnection.password,
    tls: { rejectUnauthorized: false },
});
//# sourceMappingURL=redis.js.map