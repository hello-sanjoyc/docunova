import { Queue } from 'bullmq';
import { getRedisConnection } from './email.queue';
import { createLogger } from '../config/logger';

export const OCR_QUEUE_NAME = 'ocr-extract';

export interface OcrJobData {
    documentUuid: string;
    userId: string;
    storageKey: string;
    fileExtension: string;
}

let _ocrQueue: Queue<OcrJobData> | null = null;
const logger = createLogger({ context: 'ocr-queue' });

export function getOcrQueue(): Queue<OcrJobData> {
    if (_ocrQueue) return _ocrQueue;

    _ocrQueue = new Queue<OcrJobData>(OCR_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 15_000 },
            removeOnComplete: { count: 200 },
            removeOnFail: { count: 500 },
        },
    });

    logger.info('OCR queue initialized', { queueName: OCR_QUEUE_NAME });
    return _ocrQueue;
}

export async function enqueueOcr(
    documentUuid: string,
    userId: string,
    storageKey: string,
    fileExtension: string,
): Promise<string> {
    const queue = getOcrQueue();
    const job = await queue.add('extract', { documentUuid, userId, storageKey, fileExtension });
    logger.info('OCR job enqueued', { documentUuid, jobId: job.id });
    return job.id ?? '';
}
