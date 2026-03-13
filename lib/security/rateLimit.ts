import { createHash } from "crypto";
import { getRedisClient } from "@/lib/cache";

type RequestLike = Request | { headers: { get(name: string): string | null } };

export interface RateLimitPolicy {
  name: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
}

type MemoryEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, MemoryEntry>();

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

function getIpFromRequest(request: RequestLike): string {
  return (
    firstHeaderValue(request.headers.get("x-forwarded-for")) ||
    firstHeaderValue(request.headers.get("x-real-ip")) ||
    firstHeaderValue(request.headers.get("cf-connecting-ip")) ||
    "unknown"
  );
}

function buildRateLimitKey(policyName: string, ip: string, identity?: string): string {
  const raw = identity ? `${policyName}:${ip}:${identity}` : `${policyName}:${ip}`;
  const digest = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `rate-limit:${policyName}:${digest}`;
}

async function checkMemoryRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1000;
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const next = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, next);
    return {
      allowed: true,
      remaining: Math.max(0, policy.limit - 1),
      retryAfterSeconds: 0,
      resetAt: next.resetAt,
    };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  const allowed = entry.count <= policy.limit;
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  return {
    allowed,
    remaining: Math.max(0, policy.limit - entry.count),
    retryAfterSeconds,
    resetAt: entry.resetAt,
  };
}

async function checkRedisRateLimit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const now = Date.now();
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, policy.windowSeconds);
    }
    const ttl = await redis.ttl(key);
    const retryAfterSeconds = count > policy.limit ? Math.max(1, ttl) : 0;
    const ttlSafe = ttl > 0 ? ttl : policy.windowSeconds;
    return {
      allowed: count <= policy.limit,
      remaining: Math.max(0, policy.limit - count),
      retryAfterSeconds,
      resetAt: now + ttlSafe * 1000,
    };
  } catch {
    return null;
  }
}

export async function checkRateLimit(options: {
  request: RequestLike;
  policy: RateLimitPolicy;
  identity?: string | null;
}): Promise<RateLimitResult> {
  const ip = getIpFromRequest(options.request);
  const key = buildRateLimitKey(options.policy.name, ip, options.identity || undefined);

  const redisResult = await checkRedisRateLimit(key, options.policy);
  if (redisResult) return redisResult;
  return checkMemoryRateLimit(key, options.policy);
}

