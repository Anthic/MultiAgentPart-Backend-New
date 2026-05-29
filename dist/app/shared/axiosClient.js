"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const PYTHON_API_URL = process.env.PYTHON_API_URL;
exports.pythonApiClient = axios_1.default.create({
    baseURL: PYTHON_API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});
exports.pythonApiClient.interceptors.response.use((response) => response, (error) => {
    console.error(' Python Agent API Error:', error.response?.data || error.message);
    return Promise.reject(error);
});
//# sourceMappingURL=axiosClient.js.map