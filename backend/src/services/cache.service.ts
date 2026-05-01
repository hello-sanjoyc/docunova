import { getRedisConnection } from "../queues/email.queue";
import { createLogger } from "../config/logger";
import {
    logRedisCommand,
    withRedisCommandLog,
} from "./redisCommandLog.service";

// Thin JSON cache over the shared ioredis client.
// All failures are swallowed and logged — callers should treat cache misses
// and cache failures identically (fall back to the source of truth).

const logger = createLogger({ context: "cache" });

const KEY_PREFIX = "cache";
const inFlightLoads = new Map<string, Promise<unknown>>();

export function cacheKey(...parts: Array<string | number | bigint>) {
    return [KEY_PREFIX, ...parts.map((p) => p.toString())].join(":");
}

// BigInt isn't JSON-serializable; match the global Fastify replacer so
// cached payloads round-trip identically to what the client would receive.
function bigintReplacer(_key: string, value: unknown) {
    return typeof value === "bigint" ? value.toString() : value;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const raw = await withRedisCommandLog(
            { type: "read", command: "GET", keys: [key] },
            () => getRedisConnection().get(key),
        );
        if (raw === null) return null;
        return JSON.parse(raw) as T;
    } catch (err) {
        logger.warn("Cache read failed", { key, err });
        return null;
    }
}

export async function cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds: number,
): Promise<void> {
    try {
        const serialized = JSON.stringify(value, bigintReplacer);
        await withRedisCommandLog(
            {
                type: "write",
                command: "SET",
                keys: [key],
                ttlSeconds,
                valueBytes: Buffer.byteLength(serialized),
            },
            () => getRedisConnection().set(key, serialized, "EX", ttlSeconds),
        );
    } catch (err) {
        logger.warn("Cache write failed", { key, err });
    }
}

export async function cacheDel(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
        await withRedisCommandLog(
            { type: "write", command: "DEL", keys, keyCount: keys.length },
            () => getRedisConnection().del(...keys),
        );
    } catch (err) {
        logger.warn("Cache delete failed", { keys, err });
    }
}

export async function cacheDelByPattern(pattern: string): Promise<void> {
    const startedAt = Date.now();
    let count = 0;

    try {
        const redis = getRedisConnection();
        const stream = redis.scanStream({ match: pattern, count: 200 });
        const pipeline = redis.pipeline();
        for await (const keys of stream as AsyncIterable<string[]>) {
            for (const k of keys) {
                pipeline.del(k);
                count += 1;
            }
        }
        if (count > 0) await pipeline.exec();
        logRedisCommand({
            type: "write",
            command: "SCAN+DEL",
            pattern,
            keyCount: count,
            status: "success",
            durationMs: Date.now() - startedAt,
        });
    } catch (err) {
        logRedisCommand({
            type: "write",
            command: "SCAN+DEL",
            pattern,
            keyCount: count,
            status: "failed",
            durationMs: Date.now() - startedAt,
            err,
        });
        logger.warn("Cache pattern delete failed", { pattern, err });
    }
}

export async function cacheGetOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
): Promise<T> {
    const inFlight = inFlightLoads.get(key) as Promise<T> | undefined;
    if (inFlight) return inFlight;

    const load = (async () => {
        const cached = await cacheGet<T>(key);
        if (cached !== null) return cached;

        const fresh = await loader();
        if (fresh !== undefined && fresh !== null) {
            await cacheSet(key, fresh, ttlSeconds);
        }
        return fresh;
    })();

    inFlightLoads.set(key, load);

    try {
        return await load;
    } finally {
        if (inFlightLoads.get(key) === load) {
            inFlightLoads.delete(key);
        }
    }
}
