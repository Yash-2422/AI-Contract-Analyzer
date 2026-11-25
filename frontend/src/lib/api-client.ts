import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth-store";
import type { TokenResponse } from "@/types/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    throw new Error("No refresh token available.");
  }

  try {
    const response = await axios.post<TokenResponse>(
      `${apiClient.defaults.baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { withCredentials: true }
    );
    
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data.access_token;
  } catch (err) {
    clear();
    throw err;
  }
}

function getOrRefreshAccessToken(): Promise<string> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * The streaming chat endpoint uses fetch() so it can read SSE incrementally,
 * which means it sits outside Axios's interceptors. These helpers let that
 * path use the same in-memory token and rotating refresh flow.
 */
export async function getAccessTokenForRequest(): Promise<string | null> {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (accessToken) return accessToken;
  if (refreshToken) return getOrRefreshAccessToken();
  return null;
}

export async function refreshAccessTokenForRequest(): Promise<string> {
  return getOrRefreshAccessToken();
}

apiClient.interceptors.request.use(async (config) => {
  const endpoint = config.url ?? "";
  const isAuthMutation = /\/auth\/(login|register|refresh|logout)(?:$|\?)/.test(endpoint);
  let { accessToken, refreshToken } = useAuthStore.getState();

  // Access tokens remain memory-only. Restore one from the persisted refresh
  // token before sending the first protected request after a page reload.
  if (!accessToken && refreshToken && !isAuthMutation) {
    accessToken = await getOrRefreshAccessToken();
  }

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)(?:$|\?)/.test(
      originalRequest?.url ?? "",
    );

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newToken = await getOrRefreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // refreshAccessToken clears the auth store. ProtectedRoute observes
        // that state change and redirects without forcing a full-page reload.
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
