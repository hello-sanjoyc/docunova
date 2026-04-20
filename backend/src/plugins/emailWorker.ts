import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { startEmailWorker, stopEmailWorker } from '../workers/email.worker';
import { appLogger } from '../config/logger';

export default fp(async function emailWorkerPlugin(fastify: FastifyInstance) {
  const worker = startEmailWorker();

  appLogger.info('[email-worker] Started');

  fastify.addHook('onClose', async () => {
    await stopEmailWorker();
    appLogger.info('[email-worker] Stopped');
  });

  // Expose worker on the Fastify instance for testing / diagnostics
  fastify.decorate('emailWorker', worker);
});

declare module 'fastify' {
  interface FastifyInstance {
    emailWorker: import('bullmq').Worker;
  }
}
