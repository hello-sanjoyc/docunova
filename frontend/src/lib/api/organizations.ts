import { apiRequest } from "./request";
import { API_ENDPOINTS } from "./endpoints";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrganizationRoleCode =
    | "owner"
    | "admin"
    | "member"
    | "viewer";

export type MemberStatus = "ACTIVE" | "INVITED" | "DISABLED" | "REMOVED";

export interface OrganizationMember {
    id: string;
    status: MemberStatus;
    title: string | null;
    invitedAt: string | null;
    joinedAt: string | null;
    createdAt: string;
    role: { code: string; name: string } | null;
    user: {
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        status: string;
        lastLoginAt: string | null;
    };
}

export interface PaginatedMembers {
    data: OrganizationMember[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ListMembersQuery {
    page?: number;
    limit?: number;
    status?: "active" | "invited" | "all";
}

export interface InviteMembersRequest {
    role: OrganizationRoleCode;
    emails: string[];
}

export interface InviteOutcome {
    email: string;
    status: "invited" | "re-invited" | "already_member" | "failed";
    message?: string;
}

export interface InviteMembersResult {
    sent: number;
    total: number;
    results: InviteOutcome[];
}

export interface InvitationDetails {
    id: string;
    email: string;
    role: OrganizationRoleCode | null;
    expiresAt: string;
    hasExistingUser: boolean;
    organization: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    };
    invitedBy: { name: string; email: string } | null;
}

export interface AcceptInvitationResult {
    organization: { id: string; name: string; slug: string } | null;
    role: OrganizationRoleCode | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export function listMembers(query: ListMembersQuery = {}) {
    return apiRequest<PaginatedMembers>({
        method: "GET",
        url: API_ENDPOINTS.ORGANIZATIONS.MEMBERS,
        params: query,
    });
}

export function inviteMembers(payload: InviteMembersRequest) {
    return apiRequest<InviteMembersResult>({
        method: "POST",
        url: API_ENDPOINTS.ORGANIZATIONS.MEMBERS,
        data: payload,
    });
}

export function getInvitation(token: string) {
    return apiRequest<InvitationDetails>({
        method: "GET",
        url: API_ENDPOINTS.ORGANIZATIONS.INVITATION(token),
    });
}

export function acceptInvitation(token: string) {
    return apiRequest<AcceptInvitationResult>({
        method: "POST",
        url: API_ENDPOINTS.ORGANIZATIONS.INVITATION_ACCEPT(token),
    });
}
