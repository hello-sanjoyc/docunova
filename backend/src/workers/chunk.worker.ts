import { Worker, Job } from 'bullmq';
import { CHUNK_QUEUE_NAME, ChunkJobData } from '../queues/chunk.queue';
import { getRedisConnectionOptions } from '../queues/email.queue';
import { chunkDocument } from '../services/documentChat.service';
import { appLogger } from '../config/logger';

let _worker: Worker<ChunkJobData> | null = null;

async function processChunkJob(job: Job<ChunkJobData>): Promise<void> {
    const { documentUuid, userId } = job.data;
    appLogger.info('[chunk-worker] Job started', { jobId: job.id, documentUuid });

    await job.updateProgress(10);
    await chunkDocument(documentUuid, userId);
    await job.updateProgress(100);

    appLogger.info('[chunk-worker] Chunking complete', { jobId: job.id, documentUuid });
}

export function startChunkWorker(): Worker<ChunkJobData> {
    if (_worker) return _worker;

    _worker = new Worker<ChunkJobData>(CHUNK_QUEUE_NAME, processChunkJob, {
        connection: getRedisConnectionOptions(),
        concurrency: 2,
    });

    _worker.on('completed', (job) => {
        appLogger.info('[chunk-worker] Job completed', {
            jobId: job.id,
            documentUuid: job.data.documentUuid,
        });
    });

    _worker.on('failed', (job, err) => {
        appLogger.error('[chunk-worker] Job failed', {
            jobId: job?.id,
            documentUuid: job?.data.documentUuid,
            errorMessage: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
    });

    return _worker;
}

export async function stopChunkWorker(): Promise<void> {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
}
