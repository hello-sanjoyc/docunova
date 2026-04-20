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
  roleCode:         string | null;
  roleName:         string | null;
  authProvider:     string;
  emailVerifiedAt:  string | null;
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
