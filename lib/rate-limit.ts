import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

function createSlidingWindow(limit: number, duration: string) {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, duration),
    analytics: true,
    prefix: "synapse:ratelimit",
  });
}

export const rateLimiters = {
  llmPerIp: createSlidingWindow(30, "1 h"),
  llmPerUser: createSlidingWindow(200, "1 d"),
  authPerIp: createSlidingWindow(50, "1 h"),
  syncPerIp: createSlidingWindow(10, "1 h"),
};

export async function enforceRateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<{ success: boolean; reset?: number; remaining?: number }> {
  if (!limiter) {
    return { success: true };
  }

  const result = await limiter.limit(key);
  return {
    success: result.success,
    reset: result.reset,
    remaining: result.remaining,
  };
}

