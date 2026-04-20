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
        SESSIONS: "/users/me/sessions",
        SESSION: (id: string) => `/users/me/sessions/${id}`,
        // admin
        LIST: "/users",
        // legacy
        PROFILE: "/users/profile",
    },
    DOCUMENTS: {
        BASE: "/documents",
    },
    SEARCH: {
        BASE: "/search",
    },
    ORGANIZATIONS: {
        MEMBERS:    "/organizations/me/members",
        INVITATION:        (token: string) => `/organizations/invitations/${token}`,
        INVITATION_ACCEPT: (token: string) => `/organizations/invitations/${token}/accept`,
    },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
