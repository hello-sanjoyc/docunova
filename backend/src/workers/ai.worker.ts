import { Worker, Job } from 'bullmq';
import { AI_QUEUE_NAME, AiSummarizeJobData } from '../queues/ai.queue';
import { getRedisConnection } from '../queues/email.queue';
import { runAiSummarize } from '../services/aiSummarize.service';
import { appLogger } from '../config/logger';

let _worker: Worker<AiSummarizeJobData> | null = null;

async function processAiJob(job: Job<AiSummarizeJobData>): Promise<void> {
    const { documentUuid, userId } = job.data;
    appLogger.info('[ai-worker] Job started', {
        jobId: job.id,
        documentUuid,
    });

    await job.updateProgress(5);
    appLogger.info('[ai-worker] Calling AI model', {
        jobId: job.id,
        provider: process.env.AI_PROVIDER ?? 'openai',
        model: process.env.AI_MODEL_NAME ?? 'unknown',
    });

    await runAiSummarize(documentUuid, userId);

    await job.updateProgress(100);
    appLogger.info('[ai-worker] AI model responded and summary persisted', {
        jobId: job.id,
        documentUuid,
    });
}

export function startAiWorker(): Worker<AiSummarizeJobData> {
    if (_worker) return _worker;

    _worker = new Worker<AiSummarizeJobData>(AI_QUEUE_NAME, processAiJob, {
        connection: getRedisConnection(),
        concurrency: 3,
    });

    _worker.on('completed', (job) => {
        appLogger.info('[ai-worker] Job completed', {
            jobId: job.id,
            documentUuid: job.data.documentUuid,
        });
    });

    _worker.on('failed', (job, err) => {
        appLogger.error('[ai-worker] Job failed', {
            jobId: job?.id,
            documentUuid: job?.data.documentUuid,
            err,
        });
    });

    return _worker;
}

export async function stopAiWorker(): Promise<void> {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
}
