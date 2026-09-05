import { prisma } from './prisma';

export interface RateLimitRecord {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

export interface RateLimitResult {
  isBlocked: boolean;
  remainingAttempts: number;
  waitTimeSeconds?: number;
}

// Global in-memory store attached to globalThis to survive Next.js module reloads in dev
const globalForRateLimit = globalThis as unknown as {
  pktRateLimitMap?: Map<string, RateLimitRecord>;
};

const rateLimitMap: Map<string, RateLimitRecord> =
  globalForRateLimit.pktRateLimitMap || new Map<string, RateLimitRecord>();

if (!globalForRateLimit.pktRateLimitMap) {
  globalForRateLimit.pktRateLimitMap = rateLimitMap;
}

// Cleanup stale in-memory records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.blockedUntil && record.blockedUntil > now) continue;
      if (now - record.lastAttempt > 3600000) {
        rateLimitMap.delete(key);
      }
    }
  }, 600000);
}

const DB_PREFIX = 'ratelimit:';

async function persistToDb(key: string, record: RateLimitRecord): Promise<void> {
  try {
    const dbKey = `${DB_PREFIX}${key}`;
    await prisma.appSetting.upsert({
      where: { key: dbKey },
      create: {
        key: dbKey,
        value: JSON.stringify(record),
      },
      update: {
        value: JSON.stringify(record),
      },
    });
  } catch (err) {
    // silent
  }
}

async function deleteFromDb(key: string): Promise<void> {
  try {
    const dbKey = `${DB_PREFIX}${key}`;
    await prisma.appSetting.deleteMany({
      where: { key: dbKey },
    });
  } catch (err) {
    // silent
  }
}

async function loadFromDb(key: string): Promise<RateLimitRecord | null> {
  try {
    const dbKey = `${DB_PREFIX}${key}`;
    const row = await prisma.appSetting.findUnique({
      where: { key: dbKey },
    });
    if (!row || !row.value) return null;
    return JSON.parse(row.value) as RateLimitRecord;
  } catch {
    return null;
  }
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 300000,
  _blockDurationMs: number = 300000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const waitTimeSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        isBlocked: true,
        remainingAttempts: 0,
        waitTimeSeconds,
      };
    }

    if (now - record.lastAttempt > windowMs) {
      record.attempts = 0;
      record.blockedUntil = undefined;
    }

    const remaining = Math.max(0, maxAttempts - record.attempts);
    return {
      isBlocked: false,
      remainingAttempts: remaining,
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: maxAttempts,
  };
}

export async function checkRateLimitAsync(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 300000,
  _blockDurationMs: number = 300000
): Promise<RateLimitResult> {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record || (!record.blockedUntil && record.attempts === 0)) {
    const dbRecord = await loadFromDb(key);
    if (dbRecord) {
      record = dbRecord;
      rateLimitMap.set(key, record);
    }
  }

  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const waitTimeSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return {
        isBlocked: true,
        remainingAttempts: 0,
        waitTimeSeconds,
      };
    }

    if (now - record.lastAttempt > windowMs) {
      record.attempts = 0;
      record.blockedUntil = undefined;
      deleteFromDb(key).catch(() => {});
    }

    const remaining = Math.max(0, maxAttempts - record.attempts);
    return {
      isBlocked: false,
      remainingAttempts: remaining,
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: maxAttempts,
  };
}

export async function recordFailedAttemptAsync(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 300000,
  blockDurationMs: number = 300000
): Promise<RateLimitResult> {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    const dbRecord = await loadFromDb(key);
    if (dbRecord) record = dbRecord;
  }

  if (!record) {
    record = { attempts: 1, lastAttempt: now };
    rateLimitMap.set(key, record);
  } else {
    if (now - record.lastAttempt > windowMs) {
      record.attempts = 1;
      record.blockedUntil = undefined;
    } else {
      record.attempts += 1;
    }
    record.lastAttempt = now;
    rateLimitMap.set(key, record);
  }

  if (record.attempts >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs;
    await persistToDb(key, record);
    const waitTimeSeconds = Math.ceil(blockDurationMs / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      waitTimeSeconds,
    };
  }

  await persistToDb(key, record);
  const remaining = Math.max(0, maxAttempts - record.attempts);
  return {
    isBlocked: false,
    remainingAttempts: remaining,
  };
}

export async function resetRateLimitAsync(key: string): Promise<void> {
  rateLimitMap.delete(key);
  await deleteFromDb(key);
}
