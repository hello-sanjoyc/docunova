import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types';
import prisma from '../config/prisma';
import { cacheGetOrSet, cacheKey } from '../services/cache.service';
import { AppRole, toAppRole } from '../utils/roles';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

// Cached auth lookup: runs on every authenticated request, so trading a
// DB hop for a Redis GET is a big win. Invalidated in auth/user services
// when status or emailVerifiedAt changes.
const AUTH_CACHE_TTL_SECONDS = 60;

interface AuthCacheEntry {
  status: string;
  emailVerifiedAt: string | null;
  role: AppRole;
}

export function authCacheKey(userUuid: string) {
  return cacheKey('auth', userUuid);
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();

    const entry = await cacheGetOrSet<AuthCacheEntry | null>(
      authCacheKey(request.user.userId),
      AUTH_CACHE_TTL_SECONDS,
      async () => {
        const user = await prisma.user.findUnique({
          where: { uuid: request.user.userId, deletedAt: null },
          select: {
            organizationId: true,
            emailVerifiedAt: true,
            status: true,
            organizationMembers: {
              where: { status: 'ACTIVE' },
              select: {
                organizationId: true,
                role: {
                  select: { code: true },
                },
              },
            },
          },
        });
        if (!user) return null;
        return {
          status: user.status,
          emailVerifiedAt: user.emailVerifiedAt
            ? user.emailVerifiedAt.toISOString()
            : null,
          role: toAppRole(
            (
              user.organizationMembers.find(
                (member) => member.organizationId === user.organizationId,
              ) ?? user.organizationMembers[0]
            )?.role?.code,
          ),
        };
      },
    );

    if (!entry || entry.status === 'DELETED') {
      reply.status(401).send({ statusCode: 401, success: false, message: 'Unauthorized' });
      return;
    }

    request.user.role = entry.role;

    if (!entry.emailVerifiedAt) {
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

export function requireRoles(...roles: AppRole[]) {
  return async function authorize(request: FastifyRequest, reply: FastifyReply) {
    if (!roles.includes(request.user.role)) {
      reply.status(403).send({
        statusCode: 403,
        success: false,
        message: 'Forbidden',
      });
    }
  };
}
