import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { startAiWorker, stopAiWorker } from '../workers/ai.worker';
import { appLogger } from '../config/logger';

export default fp(async function aiWorkerPlugin(fastify: FastifyInstance) {
    const worker = startAiWorker();

    appLogger.info('[ai-worker] Started');

    fastify.addHook('onClose', async () => {
        await stopAiWorker();
        appLogger.info('[ai-worker] Stopped');
    });

    fastify.decorate('aiWorker', worker);
});

declare module 'fastify' {
    interface FastifyInstance {
        aiWorker: import('bullmq').Worker;
    }
}
