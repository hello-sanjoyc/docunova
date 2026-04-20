import { getRedisConnection } from "../queues/email.queue";
import env from "../config/env";
import { createLogger } from "../config/logger";

// Per-user sorted set of document UUIDs a user has seen in search results.
// - key:     search:recent:<userUuid>
// - member:  document UUID
// - score:   unix epoch (ms) of the most recent search that surfaced it
//
// ZADD keeps the score monotonically increasing via GT so re-searching the
// same document refreshes its recency. A key TTL of RECENT_DAYS bounds
// storage without a separate reaper.

function keyFor(userUuid: string) {
    return `search:recent:${userUuid}`;
}

function windowMs() {
    return env.RECENT_DAYS * 24 * 60 * 60 * 1000;
}

export async function recordSearchedDocuments(
    userUuid: string,
    documentUuids: string[],
): Promise<void> {
    if (!documentUuids.length) return;

    const logger = createLogger({ context: "search-cache" });
    const redis = getRedisConnection();
    const key = keyFor(userUuid);
    const now = Date.now();

    try {
        const pipeline = redis.pipeline();
        const args: (string | number)[] = [];
        for (const uuid of documentUuids) {
            args.push(now, uuid);
        }
        pipeline.zadd(key, "GT", ...args);
        pipeline.zremrangebyscore(key, 0, now - windowMs());
        pipeline.pexpire(key, windowMs());
        await pipeline.exec();
    } catch (err) {
        logger.warn("Failed to record searched documents in Redis", {
            userUuid,
            count: documentUuids.length,
            err,
        });
    }
}

export async function getRecentlySearchedDocumentUuids(
    userUuid: string,
): Promise<{ uuid: string; lastSearchedAt: Date }[]> {
    const logger = createLogger({ context: "search-cache" });
    const redis = getRedisConnection();
    const key = keyFor(userUuid);
    const min = Date.now() - windowMs();

    try {
        const entries = await redis.zrangebyscore(
            key,
            min,
            "+inf",
            "WITHSCORES",
        );
        const out: { uuid: string; lastSearchedAt: Date }[] = [];
        for (let i = 0; i < entries.length; i += 2) {
            out.push({
                uuid: entries[i],
                lastSearchedAt: new Date(Number(entries[i + 1])),
            });
        }
        return out;
    } catch (err) {
        logger.warn("Failed to read recent searched documents from Redis", {
            userUuid,
            err,
        });
        return [];
    }
}

export async function clearRecentSearchedDocuments(
    userUuid: string,
): Promise<number> {
    const redis = getRedisConnection();
    return redis.del(keyFor(userUuid));
}
