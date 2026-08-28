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
const researchKey = (topic, mode = 'deep') => `research:${crypto_1.default.createHash('md5').update(`${normalizeTopic(topic)}:${mode}`).digest('hex')}`;
const jobTopicKey = (jobId) => `job:${jobId}`;
const startResearch = async (payload, userId) => {
    const mode = payload.mode || 'deep';
    try {
        const cached = await redis_1.redis.get(researchKey(payload.topic, mode));
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.status === 'done' || parsed.status === 'running') {
                    if (userId && parsed.result && parsed.status === 'done') {
                        const jobResult = parsed.result;
                        axiosClient_1.pythonApiClient.post('/history', {
                            job_id: parsed.job_id || crypto_1.default.randomUUID().substring(0, 12),
                            user_id: userId,
                            topic: jobResult.topic || payload.topic,
                            report: jobResult.report || '',
                            critique: jobResult.critique || '',
                            score: jobResult.critique_score || 0,
                            fact_score: jobResult.fact_check_score || 0,
                            urls: jobResult.verified_urls || [],
                            time_sec: jobResult.time_sec || 0,
                        }).catch((err) => {
                            console.error('Failed to save cached job to history:', err.message);
                        });
                    }
                    return parsed;
                }
            }
            catch (error) {
                console.error(`[Cache Error] Failed to parse cached research for topic "${payload.topic}". Evicting.`, error);
                await redis_1.redis.del(researchKey(payload.topic, mode));
            }
        }
        const response = await axiosClient_1.pythonApiClient.post('/research', { topic: payload.topic, user_id: userId, mode });
        const ttl = response.data.status === 'done' ? RESEARCH_CACHE_TTL : 300;
        await redis_1.redis.setex(researchKey(payload.topic, mode), ttl, JSON.stringify(response.data));
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
            try {
                return JSON.parse(cached);
            }
            catch (err) {
                console.error(`[Cache Error] Failed to parse cached job status for "${jobId}". Evicting.`, err);
                await redis_1.redis.del(cacheKey);
            }
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
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'User ID is required to fetch history');
    }
    try {
        const url = `/history?limit=${limit}&user_id=${userId}`;
        const response = await axiosClient_1.pythonApiClient.get(url);
        const mapped = (response.data.records || []).map((rec) => ({
            job_id: rec.job_id || String(rec.id),
            user_id: rec.user_id,
            status: 'done',
            progress: 100,
            stage: 'Complete',
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
        return {
            records: mapped,
            count: mapped.length,
        };
    }
    catch (error) {
        const message = error.response?.data?.detail ||
            error.message ||
            'Failed to fetch history';
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, message);
    }
};
const getHistoryById = async (id, userId) => {
    try {
        const response = await axiosClient_1.pythonApiClient.get(`/history/${id}`);
        const dbRec = response.data;
        if (!dbRec) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'History record not found');
        }
        if (userId && dbRec.user_id && dbRec.user_id !== userId) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Access denied: You do not own this research history record');
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
        if (error.statusCode === 403 || error.status === 403)
            throw error;
        if (error.response?.status === 404 || error.statusCode === 404)
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'History record not found');
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, 'Failed to fetch history record');
    }
};
const getCacheStats = async () => {
    const cacheKey = 'stats_cache:python_api';
    try {
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const response = await axiosClient_1.pythonApiClient.get('/cache/stats');
        await redis_1.redis.setex(cacheKey, 10, JSON.stringify(response.data));
        return response.data;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_1.default.BAD_GATEWAY, 'Failed to fetch cache stats');
    }
};
const checkAgentHealth = async () => {
    const cacheKey = 'health_cache:python_api';
    try {
        const cached = await redis_1.redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const response = await axiosClient_1.pythonApiClient.get('/health');
        await redis_1.redis.setex(cacheKey, 5, JSON.stringify(response.data));
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