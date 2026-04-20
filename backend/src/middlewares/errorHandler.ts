import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import env from '../config/env';
import { appLogger } from '../config/logger';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  const message = statusCode < 500 ? error.message : 'Internal Server Error';

  appLogger.error('Request failed', {
    err: error,
    requestId: request.id,
    url: request.url,
    method: request.method,
    statusCode,
  });

  reply.status(statusCode).send({
    statusCode,
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { error: error.message }),
  });
}
