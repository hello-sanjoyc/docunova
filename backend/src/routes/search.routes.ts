import { FastifyInstance } from "fastify";
import {
    search,
    recent,
    recentStats,
    clearRecent,
} from "../controllers/search.controller";
import { authenticate } from "../middlewares/authenticate";
import {
    searchSchema,
    recentSearchesSchema,
} from "../models/search.model";

export default async function searchRoutes(fastify: FastifyInstance) {
    // All search routes require authentication
    fastify.addHook("preHandler", authenticate);

    // POST /search — full-text / semantic search
    fastify.post("/", { schema: searchSchema, handler: search });

    // GET /search/recent — recent searches for the current user
    fastify.get("/recent", { schema: recentSearchesSchema, handler: recent });

    // GET /search/recent/stats — stat counters for the recent activities cards
    fastify.get("/recent/stats", { handler: recentStats });

    // DELETE /search/recent — clear the current user's search history
    fastify.delete("/recent", { handler: clearRecent });
}
