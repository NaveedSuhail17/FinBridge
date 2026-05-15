import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from './store/auth.store';

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token + request correlation ID
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
});

// Unwrap { success, data } envelope; auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap envelope if present so callers see the payload directly
    if (
      response.data != null &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh/logout to avoid loops
    const url: string = originalRequest.url ?? '';
    if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      // Use plain axios to avoid the interceptors on this call
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      const tokens = res.data?.data ?? res.data;
      setAuth({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user });
      processQueue(null, tokens.accessToken);
      (originalRequest.headers as Record<string, string>)['Authorization'] =
        `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
