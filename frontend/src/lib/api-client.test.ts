import { beforeEach, describe, expect, it } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

const sampleUser = {
  id: "user-1",
  email: "test@example.com",
  full_name: "Test User",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("apiClient", () => {
  let mock: MockAdapter;
  let rawAxiosMock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    // api-client.ts's refreshAccessToken() deliberately calls plain
    // axios.post() rather than apiClient.post() - using apiClient would
    // re-trigger this same response interceptor recursively. That means
    // refresh calls need to be mocked on the raw axios instance, not on
    // apiClient's adapter.
    rawAxiosMock = new MockAdapter(axios);
    useAuthStore.getState().clear();
  });

  it("attaches the access token to outgoing requests", async () => {
    useAuthStore.getState().setSession("valid-access-token", "valid-refresh-token", sampleUser);

    mock.onGet("/contracts").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer valid-access-token");
      return [200, { items: [], total: 0, page: 1, page_size: 20 }];
    });

    await apiClient.get("/contracts");
  });

  it("sends no Authorization header when logged out", async () => {
    mock.onGet("/contracts").reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });

    await apiClient.get("/contracts");
  });

  it("transparently refreshes on a 401 and retries the original request", async () => {
    useAuthStore.getState().setSession("expired-token", "valid-refresh-token", sampleUser);

    let firstAttempt = true;
    mock.onGet("/contracts").reply((config) => {
      if (config.headers?.Authorization === "Bearer expired-token" && firstAttempt) {
        firstAttempt = false;
        return [401, { error: "unauthorized", message: "Token expired" }];
      }
      if (config.headers?.Authorization === "Bearer new-access-token") {
        return [200, { items: [], total: 0, page: 1, page_size: 20 }];
      }
      return [401, { error: "unauthorized", message: "Unexpected token" }];
    });

    rawAxiosMock.onPost(/\/auth\/refresh$/).reply(200, {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      token_type: "bearer",
    });

    const response = await apiClient.get("/contracts");

    expect(response.status).toBe(200);
    expect(useAuthStore.getState().accessToken).toBe("new-access-token");
    expect(useAuthStore.getState().refreshToken).toBe("new-refresh-token");
  });

  it("clears the session and does not retry when refresh itself fails", async () => {
    useAuthStore.getState().setSession("expired-token", "dead-refresh-token", sampleUser);

    mock.onGet("/contracts").reply(401, { error: "unauthorized", message: "Token expired" });
    rawAxiosMock.onPost(/\/auth\/refresh$/).reply(401, { error: "unauthorized", message: "Refresh token invalid" });

    await expect(apiClient.get("/contracts")).rejects.toBeTruthy();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("does not attempt a refresh loop on the /auth/login endpoint itself", async () => {
    mock.onPost("/auth/login").reply(401, { error: "unauthorized", message: "Bad credentials" });

    let refreshCalled = false;
    mock.onPost("/auth/refresh").reply(() => {
      refreshCalled = true;
      return [200, {}];
    });

    await expect(
      apiClient.post("/auth/login", { email: "x@example.com", password: "wrong" }),
    ).rejects.toBeTruthy();
    expect(refreshCalled).toBe(false);
  });
});