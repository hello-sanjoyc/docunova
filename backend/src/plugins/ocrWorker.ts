import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { startOcrWorker, stopOcrWorker } from '../workers/ocr.worker';
import { appLogger } from '../config/logger';

export default fp(async function ocrWorkerPlugin(fastify: FastifyInstance) {
    const worker = startOcrWorker();

    appLogger.info('[ocr-worker] Started');

    fastify.addHook('onClose', async () => {
        await stopOcrWorker();
        appLogger.info('[ocr-worker] Stopped');
    });

    fastify.decorate('ocrWorker', worker);
});

declare module 'fastify' {
    interface FastifyInstance {
        ocrWorker: import('bullmq').Worker;
    }
}
