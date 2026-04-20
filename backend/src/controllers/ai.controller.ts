import { FastifyRequest, FastifyReply } from 'fastify';
import { enqueueAiSummarize } from '../queues/ai.queue';
import { getAiSummary, getAiJobStatus, runAiSummarize } from '../services/aiSummarize.service';
import { successResponse } from '../utils/response';
import { createLogger } from '../config/logger';

interface DocumentIdParams {
    documentId: string;
}

// ── POST /ai/summarize/:documentId ─────────────────────────────────────────────
// Enqueues an AI summarization job and returns immediately.

export async function triggerSummarize(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: 'ai-controller',
        requestId: request.id,
        userId: request.user.userId,
        documentUuid: request.params.documentId,
        mode: 'async',
    });
    logger.info('AI summarize trigger requested');
    const jobId = await enqueueAiSummarize(
        request.params.documentId,
        request.user.userId,
    );
    logger.info('AI summarize job queued', { jobId });
    reply.status(202).send(
        successResponse('Summarization job queued', { jobId, status: 'QUEUED' }, 202),
    );
}

// ── POST /ai/summarize/:documentId/sync ────────────────────────────────────────
// Runs summarization inline and returns the full JSON result.
// Useful for testing; not recommended for large documents in production.

export async function triggerSummarizeSync(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: 'ai-controller',
        requestId: request.id,
        userId: request.user.userId,
        documentUuid: request.params.documentId,
        mode: 'sync',
    });
    logger.info('AI summarize sync requested');
    await runAiSummarize(request.params.documentId, request.user.userId);
    const result = await getAiSummary(request.params.documentId, request.user.userId);
    logger.info('AI summarize sync completed', {
        hasSummary: Boolean(result),
    });
    reply.send(successResponse('Summarization complete', result));
}

// ── GET /ai/summarize/:documentId/status ──────────────────────────────────────
// Returns the latest AiJob status + document status for debugging.

export async function jobStatus(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: 'ai-controller',
        requestId: request.id,
        userId: request.user.userId,
        documentUuid: request.params.documentId,
        action: 'status',
    });
    logger.info('AI job status requested');
    const result = await getAiJobStatus(request.params.documentId, request.user.userId);
    logger.info('AI job status fetched', {
        documentStatus: result.documentStatus,
        jobStatus: result.aiJob?.status ?? null,
    });
    reply.send(successResponse('Job status fetched', result));
}

// ── GET /ai/summarize/:documentId ──────────────────────────────────────────────
// Returns the stored summary for a document.

export async function fetchSummary(
    request: FastifyRequest<{ Params: DocumentIdParams }>,
    reply: FastifyReply,
) {
    const logger = createLogger({
        context: 'ai-controller',
        requestId: request.id,
        userId: request.user.userId,
        documentUuid: request.params.documentId,
        action: 'fetch-summary',
    });
    logger.info('AI summary fetch requested');
    const result = await getAiSummary(request.params.documentId, request.user.userId);
    if (!result) {
        logger.warn('AI summary not found');
        return reply.status(404).send(
            successResponse('No summary available yet', null, 404),
        );
    }
    logger.info('AI summary fetch completed');
    reply.send(successResponse('Summary fetched', result));
}
