import { redisLogger } from "../config/logger";

type RedisCommandType = "read" | "write";

type RedisCommandMeta = {
    type: RedisCommandType;
    command: string;
    keys?: string[];
    pattern?: string;
    keyCount?: number;
    ttlSeconds?: number;
    valueBytes?: number;
};

function durationSince(startedAt: number) {
    return Date.now() - startedAt;
}

export function logRedisCommand(
    meta: RedisCommandMeta & { status: "success" | "failed"; durationMs: number; err?: unknown },
) {
    const { err, ...safeMeta } = meta;
    const message = `Redis ${meta.type} command ${meta.command} ${meta.status}`;

    if (meta.status === "failed") {
        redisLogger.warn(message, { ...safeMeta, err });
        return;
    }

    redisLogger.info(message, safeMeta);
}

export async function withRedisCommandLog<T>(
    meta: RedisCommandMeta,
    operation: () => Promise<T>,
): Promise<T> {
    const startedAt = Date.now();

    try {
        const result = await operation();
        logRedisCommand({
            ...meta,
            status: "success",
            durationMs: durationSince(startedAt),
        });
        return result;
    } catch (err) {
        logRedisCommand({
            ...meta,
            status: "failed",
            durationMs: durationSince(startedAt),
            err,
        });
        throw err;
    }
}
