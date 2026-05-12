import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/authenticate';
import { documentChat } from '../controllers/documentChat.controller';

export default async function documentChatRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', authenticate);

    fastify.post('/chat/:documentId', { handler: documentChat });
}
