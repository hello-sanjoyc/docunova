import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types';
import prisma from '../config/prisma';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    const user = await prisma.user.findUnique({
      where: { uuid: request.user.userId, deletedAt: null },
      select: { id: true, emailVerifiedAt: true, status: true },
    });

    if (!user || user.status === 'DELETED') {
      reply.status(401).send({ statusCode: 401, success: false, message: 'Unauthorized' });
      return;
    }

    if (!user.emailVerifiedAt) {
      reply.status(403).send({
        statusCode: 403,
        success: false,
        message: 'Email verification required',
      });
      return;
    }
  } catch {
    reply.status(401).send({ statusCode: 401, success: false, message: 'Unauthorized' });
  }
}
