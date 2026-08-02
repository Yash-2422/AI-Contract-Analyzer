import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth-store";
import type { TokenResponse } from "@/types/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
});

// Attach the current access token to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A request awaiting the in-flight refresh gets queued here rather than
// each triggering its own /auth/refresh call - without this, N
// simultaneously-expired requests would fire N refresh calls, and Phase 2's
// refresh-token rotation means only the first would succeed (each refresh
// invalidates the previous token), so the rest would 401 again.
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
    );
    setTokens(response.data.access_token, response.data.refresh_token);
    return response.data.access_token;
  } catch (err) {
    clear();
    throw err;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh itself failed - the store is already cleared inside
        // refreshAccessToken(). Let the caller's error handling (or the
        // ProtectedRoute redirect) take it from here.
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
