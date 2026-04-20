import { FastifySchema } from "fastify";
import { JwtPayload } from "../types";

export interface RegisterBody {
    name: string;
    organizationName?: string;
    organisationName?: string;
    phone?: string;
    email: string;
    password: string;
}

export interface LoginBody {
    email: string;
    password: string;
}

export interface LogoutBody {
    refreshToken?: string;
}

export interface RefreshBody {
    refreshToken: string;
}

export interface ForgotPasswordBody {
    email: string;
}

export interface ResetPasswordBody {
    token: string;
    password: string;
}

export interface VerifyEmailBody {
    token: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    emailVerifiedAt?: Date | null;
}

export interface AuthResult {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    token: string;
}

export type AuthJwtPayload = JwtPayload;

export const registerSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
            name: { type: "string", minLength: 2 },
            organizationName: { type: "string", minLength: 2 },
            organisationName: { type: "string", minLength: 2 },
            phone: { type: "string", minLength: 7, maxLength: 30 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
        },
    },
};

export const loginSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["email", "password"],
        properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
        },
    },
};

export const logoutSchema: FastifySchema = {
    body: {
        type: "object",
        properties: {
            refreshToken: { type: "string", minLength: 16 },
        },
        additionalProperties: false,
    },
};

export const refreshSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["refreshToken"],
        properties: {
            refreshToken: { type: "string", minLength: 16 },
        },
        additionalProperties: false,
    },
};

export const forgotPasswordSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["email"],
        properties: {
            email: { type: "string", format: "email" },
        },
        additionalProperties: false,
    },
};

export const resetPasswordSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["token", "password"],
        properties: {
            token: { type: "string", minLength: 16 },
            password: { type: "string", minLength: 8 },
        },
        additionalProperties: false,
    },
};

export const verifyEmailSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["token"],
        properties: {
            token: { type: "string", minLength: 16 },
        },
        additionalProperties: false,
    },
};

// ─── 2FA ─────────────────────────────────────────────────────────────────────

export interface TwoFactorVerifyBody {
    code: string;
}

export interface TwoFactorLoginBody {
    twoFactorToken: string;
    code: string;
}

export const twoFactorVerifySchema: FastifySchema = {
    body: {
        type: "object",
        required: ["code"],
        properties: {
            code: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$" },
        },
        additionalProperties: false,
    },
};

export const twoFactorLoginSchema: FastifySchema = {
    body: {
        type: "object",
        required: ["twoFactorToken", "code"],
        properties: {
            twoFactorToken: { type: "string", minLength: 10 },
            code: { type: "string", minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$" },
        },
        additionalProperties: false,
    },
};
