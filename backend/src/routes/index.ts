import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import documentRoutes from './document.routes';
import aiRoutes from './ai.routes';
import searchRoutes from './search.routes';
import organizationRoutes from './organization.routes';

export default async function registerRoutes(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(documentRoutes, { prefix: '/documents' });
  fastify.register(aiRoutes, { prefix: '/ai' });
  fastify.register(searchRoutes, { prefix: '/search' });
  fastify.register(organizationRoutes, { prefix: '/organizations' });
}
