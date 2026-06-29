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
      try {
      const parsed = JSON.parse(cached) as IPythonJobResponse;
      // If it is cached and either done or still recently running, return it
      if (parsed.status === 'done' || parsed.status === 'running') {
        if (userId && parsed.result && parsed.status === 'done') {
          // Asynchronously save to history in background so we don't slow down the response
          const jobResult = parsed.result;
          pythonApiClient.post('/history', {
            job_id: parsed.job_id || crypto.randomUUID().substring(0, 12),
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
      } catch (error) {
        console.error(`[Cache Error] Failed to parse cached research for topic "${payload.topic}". Evicting.`, error);
        await redis.del(researchKey(payload.topic));
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
      try {
        return JSON.parse(cached);
      } catch (err) {
        console.error(`[Cache Error] Failed to parse cached job status for "${jobId}". Evicting.`, err);
        await redis.del(cacheKey); 
      }
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
  // Guard clause: enforce multi-tenant isolation
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User ID is required to fetch history');
  }

  try {
    // Query only the current user's history directly from the Python/Supabase DB
    const url = `/history?limit=${limit}&user_id=${userId}`;
    const response = await pythonApiClient.get<{
      records: any[];
      count: number;
    }>(url);

    // Map database history records to IPythonJobResponse format
    const mapped: IPythonJobResponse[] = (response.data.records || []).map((rec: any) => ({
      job_id: rec.job_id || String(rec.id),
      user_id: rec.user_id,
      status: 'done' as const,
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
  const cacheKey = 'stats_cache:python_api';
  try {
    // 1. Check local Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    // 2. Fetch fresh stats
    const response = await pythonApiClient.get('/cache/stats');
    
    // 3. Cache for 10 seconds
    await redis.setex(cacheKey, 10, JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to fetch cache stats');
  }
};

const checkAgentHealth = async () => {
  const cacheKey = 'health_cache:python_api';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    const response = await pythonApiClient.get('/health');
    
    // Cache health response for 5 seconds
    await redis.setex(cacheKey, 5, JSON.stringify(response.data));
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
