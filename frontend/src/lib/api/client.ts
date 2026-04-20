import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from './endpoints';
import { clearAuthSession, getAccessToken, getRefreshToken, setAuthSession } from './session';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:3001';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface WrappedApiResponse<TData> {
  success: boolean;
  message: string;
  data?: TData;
  error?: string;
}

interface RefreshAuthPayload {
  accessToken: string;
  refreshToken: string;
  token: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry) {
      throw error;
    }

    if (error.response?.status !== 401) {
      throw error;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      throw error;
    }

    originalRequest._retry = true;

    try {
      const refreshResponse = await axios.post<WrappedApiResponse<RefreshAuthPayload>>(
        `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const payload = refreshResponse.data?.data;
      if (!payload?.accessToken || !payload?.refreshToken) {
        clearAuthSession();
        throw error;
      }

      setAuthSession(payload.accessToken, payload.refreshToken);
      originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;

      return apiClient.request(originalRequest);
    } catch {
      clearAuthSession();
      throw error;
    }
  }
);
