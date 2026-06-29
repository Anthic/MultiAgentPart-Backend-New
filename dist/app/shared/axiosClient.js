"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const PYTHON_API_URL = process.env.PYTHON_API_URL;
class CircuitBreaker {
    state = 'CLOSED';
    failureThreshold = 5;
    cooldownPeriod = 20000;
    failureCount = 0;
    lastFailureTime = 0;
    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.cooldownPeriod) {
                this.state = 'HALF-OPEN';
                return false;
            }
            return true;
        }
        return false;
    }
    recordSuccess() {
        if (this.state === 'HALF-OPEN') {
            this.state = 'CLOSED';
            this.failureCount = 0;
        }
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF-OPEN' || this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
        }
    }
}
const breaker = new CircuitBreaker();
exports.pythonApiClient = axios_1.default.create({
    baseURL: PYTHON_API_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.pythonApiClient.interceptors.request.use((config) => {
    if (breaker.isOpen()) {
        throw new axios_1.default.CanceledError('Circuit Breaker is OPEN: Python API is currently unavailable.');
    }
    return config;
});
exports.pythonApiClient.interceptors.response.use((response) => {
    breaker.recordSuccess();
    return response;
}, (error) => {
    if (!axios_1.default.isCancel(error)) {
        breaker.recordFailure();
        console.error(' Python Agent API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
});
//# sourceMappingURL=axiosClient.js.map