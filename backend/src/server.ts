import { buildApp } from './app';
import env from './config/env';
import prisma from './config/prisma';
import { appLogger } from './config/logger';
import { connectRedis, resetRedisConnection } from './queues/email.queue';

const STARTUP_CONNECTION_ATTEMPTS = 5;
const STARTUP_RETRY_DELAY_MS = 1_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(
  name: 'DB' | 'Redis',
  connect: () => Promise<void>,
  onFailedAttempt?: () => void,
) {
  for (let attempt = 1; attempt <= STARTUP_CONNECTION_ATTEMPTS; attempt += 1) {
    try {
      await connect();
      appLogger.info(`${name} connection established`, { attempt });
      return;
    } catch (err) {
      appLogger.warn(`${name} connection attempt failed`, {
        attempt,
        maxAttempts: STARTUP_CONNECTION_ATTEMPTS,
        err,
      });
      onFailedAttempt?.();

      if (attempt === STARTUP_CONNECTION_ATTEMPTS) {
        appLogger.error(`Unable to connect ${name} after ${STARTUP_CONNECTION_ATTEMPTS} attempts`, {
          err,
        });
        throw err;
      }

      await sleep(STARTUP_RETRY_DELAY_MS);
    }
  }
}

async function verifyStartupConnections() {
  await connectWithRetry('DB', async () => {
    await prisma.$connect();
  });

  await connectWithRetry('Redis', connectRedis, resetRedisConnection);
}

async function start() {
  try {
    await verifyStartupConnections();

    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    appLogger.info('Server started', {
      host: env.HOST,
      port: env.PORT,
      url: `http://${env.HOST}:${env.PORT}`,
      nodeEnv: env.NODE_ENV,
    });
  } catch (err) {
    appLogger.error('Failed to start server. Startup aborted.', { err });
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  appLogger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught exception', { err });
  process.exit(1);
});

start();
