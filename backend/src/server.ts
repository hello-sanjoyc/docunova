import { buildApp } from './app';
import env from './config/env';
import { appLogger } from './config/logger';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    appLogger.info('Server started', {
      host: env.HOST,
      port: env.PORT,
      url: `http://${env.HOST}:${env.PORT}`,
      nodeEnv: env.NODE_ENV,
    });
  } catch (err) {
    appLogger.error('Failed to start server', { err });
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
