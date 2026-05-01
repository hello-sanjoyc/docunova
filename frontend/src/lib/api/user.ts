import { apiRequest } from './request';
import { API_ENDPOINTS } from './endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:               string;
  name:             string;
  firstName:        string | null;
  lastName:         string | null;
  email:            string;
  phone:            string | null;
  avatarUrl:        string | null;
  organizationName: string | null;
  role:             "SUPERADMIN" | "ADMIN" | "MEMBER";
  roleCode:         string | null;
  roleName:         string | null;
  authProvider:     string;
  emailVerifiedAt:  string | null;
  emailDigestsEnabled: boolean;
  securityAlertsEnabled: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt:      string | null;
  createdAt:        string | null;
  updatedAt:        string | null;
}

export interface UpdateProfileRequest {
  name?:      string;
  firstName?: string;
  lastName?:  string;
  phone?:     string;
  roleCode?: string;
  organizationName?: string;
}

export interface UserSession {
  id:         string;
  userAgent:  string | null;
  deviceName: string | null;
  deviceType: string | null;
  browser:    string | null;
  os:         string | null;
  lastSeenAt: string | null;
  expiresAt:  string;
  createdAt:  string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationPreferencesRequest {
  emailDigests?: boolean;
  securityAlerts?: boolean;
}

export interface NotificationPreferences {
  emailDigests: boolean;
  securityAlerts: boolean;
}

export interface AccessLog {
  id:         string;
  event:      "SIGN_IN";
  status:     "ACTIVE" | "REVOKED" | "EXPIRED";
  userAgent:  string | null;
  deviceName: string | null;
  deviceType: string | null;
  browser:    string | null;
  os:         string | null;
  createdAt:  string;
  lastSeenAt: string | null;
  endedAt:    string | null;
}

export interface AccessLogListResult {
  data:       AccessLog[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface DashboardOverview {
  generatedAt: string;
  user: {
    name: string;
    role?: "SUPERADMIN" | "ADMIN" | "MEMBER";
    roleCode: string | null;
    roleName: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
  storage: {
    usedBytes: string;
    totalBytes: string | null;
    usagePercent: number | null;
  };
  documentCounts: {
    total: number;
    ready: number;
    processing: number;
    uploaded: number;
    archived: number;
    failed: number;
    trashed: number;
  };
  contractInsights: {
    riskiestContracts: Array<{
      id: string;
      title: string;
      score: number;
      riskCount: number;
      highestSeverity: "high" | "medium" | "low" | null;
      summary: string | null;
      updatedAt: string;
    }>;
    upcomingRenewals: Array<{
      id: string;
      title: string;
      renewalDate: string;
      daysUntil: number;
      renewalTerms: string | null;
    }>;
    totalSpend: {
      amount: number;
      currency: string | null;
      documentCount: number;
      mixedCurrencies: boolean;
    };
  };
  teamMemberCount: number;
  recentDocuments: Array<{
    id: string;
    title: string;
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: string | null;
    status: string;
    uploadedAt: string;
    updatedAt: string;
    ownerName: string;
  }>;
  teamActivity: Array<{
    id: string;
    type: string;
    actor: string;
    eventAt: string;
    message: string;
  }>;
  uploadTrend: {
    last7Days: Array<{
      label: string;
      startDate: string;
      endDate: string;
      count: number;
    }>;
    last30Days: Array<{
      label: string;
      startDate: string;
      endDate: string;
      count: number;
    }>;
    last12Months: Array<{
      label: string;
      startDate: string;
      endDate: string;
      count: number;
    }>;
  };
  documentClassificationCounts: Array<{
    label: string;
    count: number;
  }>;
}

// ─── API functions ─────────────────────────────────────────────────────────────

export function getProfile() {
  return apiRequest<UserProfile>({ method: 'GET', url: API_ENDPOINTS.USERS.ME });
}

export function updateProfile(payload: UpdateProfileRequest) {
  return apiRequest<UserProfile>({
    method: 'PATCH',
    url:    API_ENDPOINTS.USERS.ME,
    data:   payload,
  });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  return apiRequest<UserProfile>({
    method: 'PATCH',
    url: API_ENDPOINTS.USERS.AVATAR,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function deleteAccount() {
  return apiRequest<void>({ method: 'DELETE', url: API_ENDPOINTS.USERS.ME });
}

export function getSessions() {
  return apiRequest<UserSession[]>({ method: 'GET', url: API_ENDPOINTS.USERS.SESSIONS });
}

export function revokeSession(sessionId: string) {
  return apiRequest<void>({
    method: 'DELETE',
    url:    API_ENDPOINTS.USERS.SESSION(sessionId),
  });
}

export function changePassword(payload: ChangePasswordRequest) {
  return apiRequest<void>({
    method: 'PATCH',
    url: API_ENDPOINTS.USERS.PASSWORD,
    data: payload,
  });
}

export function updateNotificationPreferences(payload: UpdateNotificationPreferencesRequest) {
  return apiRequest<NotificationPreferences>({
    method: 'PATCH',
    url: API_ENDPOINTS.USERS.NOTIFICATIONS,
    data: payload,
  });
}

export function sendEmailDigest() {
  return apiRequest<void>({
    method: 'POST',
    url: API_ENDPOINTS.USERS.EMAIL_DIGEST,
  });
}

export function getAccessLogs(page = 1, limit = 10) {
  return apiRequest<AccessLogListResult>({
    method: 'GET',
    url: API_ENDPOINTS.USERS.ACCESS_LOGS,
    params: { page, limit },
  });
}

export function getDashboardOverview() {
  return apiRequest<DashboardOverview>({
    method: 'GET',
    url: API_ENDPOINTS.USERS.DASHBOARD,
  });
}
