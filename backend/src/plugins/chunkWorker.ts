import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { startChunkWorker, stopChunkWorker } from '../workers/chunk.worker';
import { appLogger } from '../config/logger';

export default fp(async function chunkWorkerPlugin(fastify: FastifyInstance) {
    const worker = startChunkWorker();

    appLogger.info('[chunk-worker] Started');

    fastify.addHook('onClose', async () => {
        await stopChunkWorker();
        appLogger.info('[chunk-worker] Stopped');
    });

    fastify.decorate('chunkWorker', worker);
});

declare module 'fastify' {
    interface FastifyInstance {
        chunkWorker: import('bullmq').Worker;
    }
}
