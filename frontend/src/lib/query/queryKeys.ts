export const queryKeys = {
    user: {
        profile: () => ["user", "profile"] as const,
        sessions: () => ["user", "sessions"] as const,
        accessLogs: (page: number, limit: number) =>
            ["user", "accessLogs", page, limit] as const,
        dashboardOverview: () => ["user", "dashboardOverview"] as const,
    },
    documents: {
        totalUploaded: () => ["documents", "totalUploaded"] as const,
        listing: (params: {
            page: number;
            pageSize: number;
            query: string;
            status: string;
        }) => ["documents", "listing", params] as const,
        trashListing: (params: { page: number; pageSize: number }) =>
            ["documents", "trashListing", params] as const,
    },
    activities: {
        recent: (limit: number) => ["activities", "recent", limit] as const,
        stats: () => ["activities", "stats"] as const,
    },
    team: {
        members: () => ["team", "members"] as const,
    },
    pricing: {
        listing: (regionCode: string) => ["pricing", "listing", regionCode] as const,
        plan: (slug: string, regionCode: string) =>
            ["pricing", "plan", slug, regionCode] as const,
    },
    subscriptions: {
        current: () => ["subscriptions", "current"] as const,
    },
    usage: {
        summary: () => ["usage", "summary"] as const,
    },
    organizations: {
        invitation: (token: string) => ["organizations", "invitation", token] as const,
    },
} as const;
