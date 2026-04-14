import type { FastifyRequest } from "fastify";
import type { Plan, User } from "@prisma/client";

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  plan: Plan;
}

// ─── Authenticated Request ────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  plan: Plan;
}

export type AuthenticatedRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

// ─── Plan limits ─────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<Plan, { maxDocuments: number | null }> = {
  FREE: { maxDocuments: 3 },
  PRO: { maxDocuments: null },
  TEAM: { maxDocuments: null },
};

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
}

export function planAllows(plan: Plan, feature: "shareLinks" | "questions" | "history" | "team"): boolean {
  switch (feature) {
    case "history":
    case "shareLinks":
    case "questions":
      return plan === "PRO" || plan === "TEAM";
    case "team":
      return plan === "TEAM";
  }
}
