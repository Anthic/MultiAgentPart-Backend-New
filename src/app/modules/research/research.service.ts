import { redis } from './../../../config/redis';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { pythonApiClient } from '../../shared/axiosClient';
import {
  IPythonJobResponse,
  IResearchStartRequest,
} from './research.interface';
import crypto from 'crypto';

const RESEARCH_CACHE_TTL = 60 * 60 * 24;

const JOB_TOPIC_TTL = 60 * 60 * 2;

const normalizeTopic = (topic: string): string =>
  topic.toLocaleLowerCase().trim().replace(/\s+/g, ' ');

const researchKey = (topic: string): string =>
  `research:${crypto.createHash('md5').update(normalizeTopic(topic)).digest('hex')}`;

const jobTopicKey = (jobId: string): string => `job:${jobId}`;

//service part start
const startResearch = async (
  payload: IResearchStartRequest,
  userId?: string,
): Promise<IPythonJobResponse> => {
  try {
    //check check
    const cached = await redis.get(researchKey(payload.topic));
    if (cached) {
      const parsed = JSON.parse(cached) as IPythonJobResponse;
      // If it is cached and either done or still recently running, return it
      if (parsed.status === 'done' || parsed.status === 'running') {
        return parsed;
      }
    }
    //no cache then python call
    const response = await pythonApiClient.post<IPythonJobResponse>(
      '/research',
      { topic: payload.topic, user_id: userId },
    );

    // If it's done, cache for 24h. If it's running, cache for only 5m to avoid lockouts.
    const ttl = response.data.status === 'done' ? RESEARCH_CACHE_TTL : 300;
    await redis.setex(
      researchKey(payload.topic),
      ttl,
      JSON.stringify(response.data),
    );

    //job id theke topic maping bridge
    await redis.setex(
      jobTopicKey(response.data.job_id),
      JOB_TOPIC_TTL,
      normalizeTopic(payload.topic),
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Failed to start research job';
    throw new ApiError(httpStatus.BAD_GATEWAY, message);
  }
};

const getJobStatus = async (jobId: string): Promise<IPythonJobResponse> => {
  try {
    const cacheKey = `job_status_cache:${jobId}`;

    // 1. Check short-term status cache in Redis first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let res;
    try {
      res = await pythonApiClient.get<IPythonJobResponse>(`/job/${jobId}`);
    } catch (pollError: any) {
      if (pollError.response?.status === 404) {
        // Fallback: Check if the job exists in Supabase history
        try {
          const historyRes = await pythonApiClient.get<any>(`/history/${jobId}`);
          if (historyRes.data) {
            const dbRec = historyRes.data;
            return {
              job_id: dbRec.job_id || String(dbRec.id),
              status: 'done' as const,
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
        } catch (historyError: any) {
          // If history also fails or is not found, continue to throw the original 404
        }
      }
      throw pollError;
    }
    
    // 2. Cache running/queued statuses for 3 seconds to avoid spamming the Python API
    if (res.data.status === 'running' || res.data.status === 'queued') {
      await redis.setex(cacheKey, 3, JSON.stringify(res.data));
    }

    // 3. If the job completed successfully, update the main topic cache with the final result!
    if (res.data.status === 'done' && res.data.result) {
      const topic = await redis.get(jobTopicKey(jobId));
      if (topic) {
        await redis.setex(
          researchKey(topic),
          RESEARCH_CACHE_TTL,
          JSON.stringify(res.data),
        );
      }
    } else if (res.data.status === 'failed') {
      // If the job failed, immediately clear the cache so the user can retry
      const topic = await redis.get(jobTopicKey(jobId));
      if (topic) {
        await redis.del(researchKey(topic));
      }
    }
    
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new ApiError(httpStatus.NOT_FOUND, `Job '${jobId}' not found`);
    }
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Failed to fetch job status';
    throw new ApiError(httpStatus.BAD_GATEWAY, message);
  }
};
const getResearchHistory = async (
  limit: number = 10,
  userId?: string,
): Promise<{ records: IPythonJobResponse[]; count: number }> => {
  try {
    const url = userId ? `/history?limit=${limit}&userId=${userId}&user_id=${userId}` : `/history?limit=${limit}`;
    console.log("=== getResearchHistory Service Calling URL ===", url, "with userId =", userId);
    const response = await pythonApiClient.get<{
      records: any[];
      count: number;
    }>(url);

    // Map the database history records to IPythonJobResponse format so the Next.js frontend aligns perfectly
    const mapped: IPythonJobResponse[] = (response.data.records || []).map((rec: any) => ({
      job_id: rec.job_id || String(rec.id),
      user_id: rec.user_id, // Map user_id!
      status: 'done' as const,
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

    // Defensive Post-Filtering: Ensure we ONLY return the history of the logged-in user!
    // This absolutely guarantees that Lynn Sanders only sees Lynn Sanders' history.
    let filtered = mapped;
    if (userId) {
      filtered = mapped.filter((rec) => rec.user_id === userId);
      console.log(`=== Post-filtered history records: before = ${mapped.length}, after = ${filtered.length} for userId = ${userId} ===`);
    }

    return {
      records: filtered,
      count: filtered.length,
    };
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Failed to fetch history';
    throw new ApiError(httpStatus.BAD_GATEWAY, message);
  }
};
const getHistoryById = async (id: string) => {
  try {
    const response = await pythonApiClient.get<any>(`/history/${id}`);
    const dbRec = response.data;
    if (!dbRec) {
      throw new ApiError(httpStatus.NOT_FOUND, 'History record not found');
    }
    // Return mapped format for individual history lookups as well
    return {
      job_id: dbRec.job_id || String(dbRec.id),
      status: 'done' as const,
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
  } catch (error: any) {
    if (error.response?.status === 404 || error.statusCode === 404)
      throw new ApiError(httpStatus.NOT_FOUND, 'History record not found');
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      'Failed to fetch history record',
    );
  }
};

const getCacheStats = async () => {
  try {
    const response = await pythonApiClient.get('/cache/stats');
    return response.data;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to fetch cache stats');
  }
};
const checkAgentHealth = async () => {
  try {
    const response = await pythonApiClient.get('/health');
    return response.data;
  } catch (error: any) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Agent service is down');
  }
};
export const ResearchService = {
  startResearch,
  getJobStatus,
  getResearchHistory,
  getHistoryById,
  getCacheStats,
  checkAgentHealth,
};
