import type { RequestHandler } from "express";
import { rateLimit, MemoryStore } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";
import { Redis } from "ioredis";
import { ApiErrorCode } from "@marketplace/shared";
import { env } from "../config/env.js";
import { logger } from "../logger.js";

export let redis: Redis | null = null;

let redisAvailable = false;
let rateLimiterReady = false;

function rateLimitEnabled(): boolean {
  // Read live so tests can flip it without module reloads.
  const raw = process.env.RATE_LIMIT_ENABLED ?? "true";
  return raw === "true";
}

/**
 * Connects the shared Redis client used by rate limiting (and later caching/
 * queues). Falls back to in-memory stores so the API still works if Redis is
 * unavailable, and skips Redis entirely when limiting is disabled (tests/CI).
 */
export async function initRateLimiter(): Promise<void> {
  if (rateLimiterReady) return;
  rateLimiterReady = true;

  if (!rateLimitEnabled() || env.RATE_LIMIT_STORE === "memory") return;

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  try {
    await client.connect();
    await client.ping();
    redis = client;
    redisAvailable = true;
    logger.info("Rate limiting connected to Redis");
  } catch (err) {
    logger.warn({ err }, "Redis unavailable — falling back to in-memory rate limiting");
  }
}

export interface RateLimitConfig {
  windowMs: number;
  limit: number;
  message?: string;
}

const rateLimitedBody = (message: string) => ({
  success: false,
  error: { code: ApiErrorCode.RATE_LIMITED, message },
});

export function createRateLimiter(config: RateLimitConfig): RequestHandler {
  if (!rateLimitEnabled()) {
    return (_req, _res, next) => next();
  }

  const store = redisAvailable
    ? new RedisStore({
        prefix: "rl:",
        sendCommand: (...args: string[]) => {
          if (!redis) throw new Error("Redis client unavailable");
          const call = redis.call.bind(redis) as (
            ...a: string[]
          ) => Promise<RedisReply>;
          return call(...args);
        },
      })
    : new MemoryStore();

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store,
    message: rateLimitedBody(
      config.message ?? "Too many requests, please try again later"
    ),
  });
}
