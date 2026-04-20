import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

export default prismaPlugin;
