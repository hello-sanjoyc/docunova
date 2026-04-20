import { API_ENDPOINTS } from "./endpoints";
import { apiRequest } from "./request";
import type { DocumentItem } from "./documents";

export type RecentActivitySource = "created" | "searched";

export interface RecentActivityItem extends DocumentItem {
    recentAt: string;
    latestSource: RecentActivitySource;
}

export interface RecentActivitiesResponse {
    recentDays: number;
    windowStart: string;
    total: number;
    items: RecentActivityItem[];
}

export interface RecentActivityStats {
    recentDays: number;
    windowStart: string;
    createdCount: number;
    searchedCount: number;
    trashedCount: number;
}

export function getRecentActivities(limit = 20) {
    return apiRequest<RecentActivitiesResponse>({
        method: "GET",
        url: `${API_ENDPOINTS.SEARCH.BASE}/recent`,
        params: { limit },
    });
}

export function getRecentActivityStats() {
    return apiRequest<RecentActivityStats>({
        method: "GET",
        url: `${API_ENDPOINTS.SEARCH.BASE}/recent/stats`,
    });
}

export function clearRecentSearches() {
    return apiRequest<{ deleted: number }>({
        method: "DELETE",
        url: `${API_ENDPOINTS.SEARCH.BASE}/recent`,
    });
}
