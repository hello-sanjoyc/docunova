export const API_ENDPOINTS = {
    AUTH: {
        GOOGLE: "/auth/google",
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password",
        VERIFY_EMAIL: "/auth/verify-email",
        ME: "/auth/me",
        TWO_FACTOR_ENABLE:  "/auth/2fa/enable",
        TWO_FACTOR_VERIFY:  "/auth/2fa/verify",
        TWO_FACTOR_DISABLE: "/auth/2fa/disable",
        TWO_FACTOR_LOGIN:   "/auth/2fa/login",
    },
    USERS: {
        ME: "/users/me",
        PASSWORD: "/users/me/password",
        AVATAR: "/users/me/avatar",
        DASHBOARD: "/users/me/dashboard",
        NOTIFICATIONS: "/users/me/notifications",
        EMAIL_DIGEST: "/users/me/notifications/email-digest",
        SESSIONS: "/users/me/sessions",
        ACCESS_LOGS: "/users/me/access-logs",
        SESSION: (id: string) => `/users/me/sessions/${id}`,
        // admin
        LIST: "/users",
        // legacy
        PROFILE: "/users/profile",
    },
    DOCUMENTS: {
        BASE: "/documents",
    },
    AI: {
        SUMMARIZE: (documentId: string) => `/ai/summarize/${documentId}`,
    },
    SEARCH: {
        BASE: "/search",
    },
    PRICING: {
        BASE: "/api/pricing",
        PLAN: (slug: string) => `/api/plans/${slug}`,
    },
    SUBSCRIPTIONS: {
        BASE: "/api/subscriptions",
        CURRENT: "/api/subscriptions/current",
        CANCEL: "/api/subscriptions/cancel",
    },
    USAGE: {
        SUMMARY: "/api/usage/summary",
        CHECK: "/api/usage/check",
        RECORD: "/api/usage/record",
    },
    ORGANIZATIONS: {
        MEMBERS:    "/organizations/me/members",
        INVITATION:        (token: string) => `/organizations/invitations/${token}`,
        INVITATION_ACCEPT: (token: string) => `/organizations/invitations/${token}/accept`,
    },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
