import { Queue } from 'bullmq';
import { getRedisConnection } from './email.queue';
import { createLogger } from '../config/logger';

export const AI_QUEUE_NAME = 'ai-summarize';

export interface AiSummarizeJobData {
    documentUuid: string;  // Document.uuid
    userId: string;        // User.uuid — for access control in worker
}

let _aiQueue: Queue<AiSummarizeJobData> | null = null;
const logger = createLogger({ context: 'ai-queue' });

export function getAiQueue(): Queue<AiSummarizeJobData> {
    if (_aiQueue) return _aiQueue;

    logger.info('Initializing AI queue connection', {
        queueName: AI_QUEUE_NAME,
    });
    _aiQueue = new Queue<AiSummarizeJobData>(AI_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 10_000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 500 },
        },
    });

    return _aiQueue;
}

export async function enqueueAiSummarize(
    documentUuid: string,
    userId: string,
): Promise<string> {
    const queue = getAiQueue();
    logger.info('Enqueue AI summarize requested', { documentUuid, userId });
    const job = await queue.add('summarize', { documentUuid, userId });
    logger.info('Enqueue AI summarize completed', {
        documentUuid,
        userId,
        jobId: job.id,
    });
    return job.id ?? '';
}
