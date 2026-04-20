import { FastifyInstance } from 'fastify';
import {
    getProfile,
    updateProfile,
    deleteAccount,
    listSessions,
    revokeSession,
    listUsers,
    removeUser,
} from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { updateProfileSchema } from '../models/user.model';

export default async function userRoutes(fastify: FastifyInstance) {
    // ── /users/me ────────────────────────────────────────────────────────────
    fastify.get('/me',    { preHandler: authenticate, handler: getProfile });

    fastify.patch('/me', {
        preHandler: authenticate,
        schema:     updateProfileSchema,
        handler:    updateProfile,
    });

    fastify.delete('/me', { preHandler: authenticate, handler: deleteAccount });

    // ── /users/me/sessions ───────────────────────────────────────────────────
    fastify.get('/me/sessions',     { preHandler: authenticate, handler: listSessions });
    fastify.delete('/me/sessions/:id', { preHandler: authenticate, handler: revokeSession });

    // ── legacy aliases (kept for backward compat) ───────────────────────────
    fastify.get('/profile',   { preHandler: authenticate, handler: getProfile });
    fastify.patch('/profile', { preHandler: authenticate, schema: updateProfileSchema, handler: updateProfile });

    // ── admin-only ───────────────────────────────────────────────────────────
    fastify.get('/',      { preHandler: authenticate, handler: listUsers });
    fastify.delete('/:id', { preHandler: authenticate, handler: removeUser });
}
