import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './email.queue';
import { createLogger } from '../config/logger';

export const CHUNK_QUEUE_NAME = 'document-chunk';

export interface ChunkJobData {
    documentUuid: string;
    userId: string;
}

let _chunkQueue: Queue<ChunkJobData> | null = null;
const logger = createLogger({ context: 'chunk-queue' });

export function getChunkQueue(): Queue<ChunkJobData> {
    if (_chunkQueue) return _chunkQueue;

    logger.info('Initializing chunk queue connection', { queueName: CHUNK_QUEUE_NAME });
    _chunkQueue = new Queue<ChunkJobData>(CHUNK_QUEUE_NAME, {
        connection: getRedisConnectionOptions(),
        defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 8_000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 500 },
        },
    });

    return _chunkQueue;
}

export async function enqueueDocumentChunk(
    documentUuid: string,
    userId: string,
): Promise<string> {
    const queue = getChunkQueue();
    logger.info('Enqueue document chunk requested', { documentUuid, userId });
    const job = await queue.add('chunk', { documentUuid, userId });
    logger.info('Enqueue document chunk completed', { documentUuid, userId, jobId: job.id });
    return job.id ?? '';
}
