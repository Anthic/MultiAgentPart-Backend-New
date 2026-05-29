"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchService = void 0;
const redis_1 = require("./../../../config/redis");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const axiosClient_1 = require("../../shared/axiosClient");
const crypto_1 = __importDefault(require("crypto"));
const RESEARCH_CACHE_TTL = 60 * 60 * 24;
const JOB_TOPIC_TTL = 60 * 60 * 2;
const normalizeTopic = (topic) => topic.toLocaleLowerCase().trim().replace(/\s+/g, ' ');
const researchKey = (topic) => `research:${crypto_1.default.createHash('md5').update(normalizeTopic(topic)).digest('hex')}`;
const jobTopicKey = (jobId) => `job:${jobId}`;
const startResearch = async (payload, userId) => {
    try {
        const cached = await redis_1.redis.get(researchKey(payload.topic));
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.status === 'done' || parsed.status === 'running') {
                return parsed;
            }
        }
        const response = await axiosClient_1.pythonApiClient.post('/research', { topic: payload.topic, user_id: userId });
        const ttl = response.data.status === 'done' ? RESEARCH_CACHE_TTL : 300;
        await redis_1.redis.setex(researchKey(payload.topic), ttl, JSON.stringify(response.data));
        await redis_1.redis.setex(jobTopicKey(response.data.job_id), JOB_TOPIC_TTL, normalizeTopic(payload.topic));
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.detail ||
            error.message ||
            'Failed to start research job';
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, message);
    }
};
const getJobStatus = async (jobId) => {
    try {
        const cacheKey = `job_status_cache:${jobId}`;
        const cached = await redis_1.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        let res;
        try {
            res = await axiosClient_1.pythonApiClient.get(`/job/${jobId}`);
        }
        catch (pollError) {
            if (pollError.response?.status === 404) {
                try {
                    const historyRes = await axiosClient_1.pythonApiClient.get(`/history/${jobId}`);
                    if (historyRes.data) {
                        const dbRec = historyRes.data;
                        return {
                            job_id: dbRec.job_id || String(dbRec.id),
                            status: 'done',
                            progress: 100,
                            stage: '✨ Complete',
                            result: {
                                topic: dbRec.topic,
                                report: dbRec.report || '',
                                critique: dbRec.critique || '',
                                critique_score: dbRec.score || 0,
                                fact_check_score: dbRec.fact_score || 0.0,
                                rewritten_queries: [],
                                verified_urls: dbRec.urls ? (typeof dbRec.urls === 'string' ? JSON.parse(dbRec.urls) : dbRec.urls) : [],
                                time_sec: dbRec.time_sec || 0,
                                error: '',
                            },
                            error: null,
                            created_at: dbRec.created_at,
                        };
                    }
                }
                catch (historyError) {
                }
            }
            throw pollError;
        }
        if (res.data.status === 'running' || res.data.status === 'queued') {
            await redis_1.redis.setex(cacheKey, 3, JSON.stringify(res.data));
        }
        if (res.data.status === 'done' && res.data.result) {
            const topic = await redis_1.redis.get(jobTopicKey(jobId));
            if (topic) {
                await redis_1.redis.setex(researchKey(topic), RESEARCH_CACHE_TTL, JSON.stringify(res.data));
            }
        }
        else if (res.data.status === 'failed') {
            const topic = await redis_1.redis.get(jobTopicKey(jobId));
            if (topic) {
                await redis_1.redis.del(researchKey(topic));
            }
        }
        return res.data;
    }
    catch (error) {
        if (error.response?.status === 404) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, `Job '${jobId}' not found`);
        }
        const message = error.response?.data?.detail ||
            error.message ||
            'Failed to fetch job status';
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, message);
    }
};
const getResearchHistory = async (limit = 10, userId) => {
    try {
        const url = userId ? `/history?limit=${limit}&userId=${userId}&user_id=${userId}` : `/history?limit=${limit}`;
        console.log("=== getResearchHistory Service Calling URL ===", url, "with userId =", userId);
        const response = await axiosClient_1.pythonApiClient.get(url);
        const mapped = (response.data.records || []).map((rec) => ({
            job_id: rec.job_id || String(rec.id),
            user_id: rec.user_id,
            status: 'done',
            progress: 100,
            stage: ' Complete',
            result: {
                topic: rec.topic,
                report: rec.report || '',
                critique: rec.critique || '',
                critique_score: rec.score || 0,
                fact_check_score: rec.fact_score || 0.0,
                rewritten_queries: [],
                verified_urls: rec.urls ? (typeof rec.urls === 'string' ? JSON.parse(rec.urls) : rec.urls) : [],
                time_sec: rec.time_sec || 0,
                error: '',
            },
            error: null,
            created_at: rec.created_at,
        }));
        let filtered = mapped;
        if (userId) {
            filtered = mapped.filter((rec) => rec.user_id === userId);
            console.log(`=== Post-filtered history records: before = ${mapped.length}, after = ${filtered.length} for userId = ${userId} ===`);
        }
        return {
            records: filtered,
            count: filtered.length,
        };
    }
    catch (error) {
        const message = error.response?.data?.detail ||
            error.message ||
            'Failed to fetch history';
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, message);
    }
};
const getHistoryById = async (id) => {
    try {
        const response = await axiosClient_1.pythonApiClient.get(`/history/${id}`);
        const dbRec = response.data;
        if (!dbRec) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'History record not found');
        }
        return {
            job_id: dbRec.job_id || String(dbRec.id),
            status: 'done',
            progress: 100,
            stage: 'Complete',
            result: {
                topic: dbRec.topic,
                report: dbRec.report || '',
                critique: dbRec.critique || '',
                critique_score: dbRec.score || 0,
                fact_check_score: dbRec.fact_score || 0.0,
                rewritten_queries: [],
                verified_urls: dbRec.urls ? (typeof dbRec.urls === 'string' ? JSON.parse(dbRec.urls) : dbRec.urls) : [],
                time_sec: dbRec.time_sec || 0,
                error: '',
            },
            error: null,
            created_at: dbRec.created_at,
        };
    }
    catch (error) {
        if (error.response?.status === 404 || error.statusCode === 404)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'History record not found');
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, 'Failed to fetch history record');
    }
};
const getCacheStats = async () => {
    try {
        const response = await axiosClient_1.pythonApiClient.get('/cache/stats');
        return response.data;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, 'Failed to fetch cache stats');
    }
};
const checkAgentHealth = async () => {
    try {
        const response = await axiosClient_1.pythonApiClient.get('/health');
        return response.data;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.SERVICE_UNAVAILABLE, 'Agent service is down');
    }
};
exports.ResearchService = {
    startResearch,
    getJobStatus,
    getResearchHistory,
    getHistoryById,
    getCacheStats,
    checkAgentHealth,
};
//# sourceMappingURL=research.service.js.map