import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';
import env from '../config/env';

const jwtPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });
});

export default jwtPlugin;
