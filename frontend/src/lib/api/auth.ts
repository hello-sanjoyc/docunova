import { apiRequest } from './request';
import { API_ENDPOINTS } from './endpoints';
import { API_BASE_URL } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  organizationName?: string;
  organisationName?: string;
  phone?: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "MEMBER";
  emailVerifiedAt?: string | null;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  token: string;
  verifyToken?: string;
}

export interface TwoFactorChallengeResult {
  twoFactorRequired: true;
  twoFactorToken: string;
}

export type LoginResult = AuthResult | TwoFactorChallengeResult;

export interface ForgotPasswordResult {
  resetToken?: string | null;
}

export interface GenericAuthUserResult {
  user: AuthUser;
}

export function login(payload: LoginRequest) {
  return apiRequest<LoginResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.LOGIN,
    data: payload,
  });
}

export function twoFactorLogin(twoFactorToken: string, code: string) {
  return apiRequest<AuthResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.TWO_FACTOR_LOGIN,
    data: { twoFactorToken, code },
  });
}

export function register(payload: RegisterRequest) {
  return apiRequest<AuthResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.REGISTER,
    data: payload,
  });
}

export function logout(payload: LogoutRequest = {}) {
  return apiRequest<{ success: boolean }>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.LOGOUT,
    data: payload,
  });
}

export function refreshToken(payload: RefreshTokenRequest) {
  return apiRequest<AuthResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.REFRESH,
    data: payload,
  });
}

export function forgotPassword(payload: ForgotPasswordRequest) {
  return apiRequest<ForgotPasswordResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    data: payload,
  });
}

export function resetPassword(payload: ResetPasswordRequest) {
  return apiRequest<GenericAuthUserResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.RESET_PASSWORD,
    data: payload,
  });
}

export function verifyEmail(payload: VerifyEmailRequest) {
  return apiRequest<GenericAuthUserResult>({
    method: 'POST',
    url: API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    data: payload,
  });
}

export function getGoogleOAuthUrl(source: 'login' | 'signup' = 'login', target = '/dashboard') {
  const url = new URL(API_ENDPOINTS.AUTH.GOOGLE, API_BASE_URL);
  url.searchParams.set('source', source);
  url.searchParams.set('target', target);
  return url.toString();
}
