import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/authenticate';
import { triggerSummarize, triggerSummarizeSync, fetchSummary, jobStatus } from '../controllers/ai.controller';

export default async function aiRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    // Async: enqueue job, return 202 immediately
    fastify.post('/summarize/:documentId', { handler: triggerSummarize });

    // Sync: wait for AI response, return full summary
    fastify.post('/summarize/:documentId/sync', { handler: triggerSummarizeSync });

    // Fetch stored summary
    fastify.get('/summarize/:documentId', { handler: fetchSummary });

    // Job status — use this to debug processing / failures
    fastify.get('/summarize/:documentId/status', { handler: jobStatus });
}
