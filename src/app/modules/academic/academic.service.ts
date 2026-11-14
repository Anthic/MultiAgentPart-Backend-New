import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { redis } from '../../../config/redis';
import { pythonApiClient } from '../../shared/axiosClient';

/**
 * Academic AI features (peer review, slides, gap finder, vault drafting).
 *
 * The browser used to call the Python agent directly, which skipped login,
 * quotas and the internal key. All of them now go through this service:
 * the user comes from the verified JWT (never from the request body) and the
 * call is made server-to-server with X-Internal-Key (added by pythonApiClient).
 */

const HOURLY_LIMIT = Number(process.env.ACADEMIC_HOURLY_LIMIT) || 20;
const WINDOW_SECONDS = 3600;

const enforceRateLimit = async (userId: string, feature: string): Promise<void> => {
  const key = `academic:rate:${userId}:${feature}:${new Date().toISOString().slice(0, 13)}`;
  let used: number;
  try {
    // INCR first (atomic) so parallel requests cannot all see "0 used".
    used = await redis.incr(key);
    const ttl = await redis.ttl(key);
    if (used === 1 || ttl < 0) {
      await redis.expire(key, WINDOW_SECONDS);
    }
  } catch (error) {
    console.error('[Academic Rate Limit Error]:', error);
    // Fail closed: these endpoints spend LLM money.
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Service temporarily unavailable. Please retry shortly.');
  }
  if (used > HOURLY_LIMIT) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      `Hourly limit reached for this feature (${HOURLY_LIMIT} requests/hour). Please try again later.`,
    );
  }
};

const callPython = async (path: string, body: Record<string, unknown>, timeoutMs = 90000) => {
  try {
    const response = await pythonApiClient.post(path, body, { timeout: timeoutMs });
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')) {
      throw new ApiError(httpStatus.GATEWAY_TIMEOUT, 'The AI service timed out. Please try again.');
    }
    if (status && status >= 400 && status < 500 && status !== 401 && status !== 403) {
      const detail = error.response?.data?.detail;
      throw new ApiError(httpStatus.BAD_REQUEST, typeof detail === 'string' ? detail : 'Invalid request.');
    }
    throw new ApiError(httpStatus.BAD_GATEWAY, 'The AI service is unavailable right now. Please try again.');
  }
};

const peerReview = async (userId: string, p: { title: string; content: string }) => {
  await enforceRateLimit(userId, 'peer-review');
  return callPython('/api/v1/academic/peer-review', { title: p.title, content: p.content, user_id: userId });
};

const generateSlides = async (userId: string, p: { title: string; content?: string; num_slides?: number }) => {
  await enforceRateLimit(userId, 'slides');
  return callPython('/api/v1/academic/generate-slides', {
    title: p.title,
    content: p.content,
    num_slides: p.num_slides ?? 8,
    user_id: userId,
  });
};

const findGaps = async (userId: string, p: { topic: string; literature_context?: string }) => {
  await enforceRateLimit(userId, 'gap-finder');
  return callPython('/api/v1/academic/gap-finder', {
    topic: p.topic,
    literature_context: p.literature_context,
    user_id: userId,
  });
};

const draftSection = async (userId: string, p: { section_topic: string; instructions?: string }) => {
  await enforceRateLimit(userId, 'vault-draft');
  return callPython('/api/v1/vault/draft-section', {
    user_id: userId,
    section_topic: p.section_topic,
    instructions: p.instructions || 'Draft a comprehensive academic section.',
  });
};

export const AcademicService = { peerReview, generateSlides, findGaps, draftSection };
