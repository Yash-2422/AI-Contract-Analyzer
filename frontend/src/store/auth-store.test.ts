import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/auth-store";

const sampleUser = {
  id: "user-1",
  email: "test@example.com",
  full_name: "Test User",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
    localStorage.clear();
  });

  it("starts with no session", () => {
    const state = useAuthStore.getState();

    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setSession stores refresh token and user together", () => {
    useAuthStore.getState().setSession("refresh-1", sampleUser);

    const state = useAuthStore.getState();

    expect(state.refreshToken).toBe("refresh-1");
    expect(state.user).toEqual(sampleUser);
  });

  it("setTokens updates the refresh token without touching the stored user", () => {
    useAuthStore.getState().setSession("refresh-1", sampleUser);
    useAuthStore.getState().setTokens("access-2", "refresh-2");

    const state = useAuthStore.getState();

    expect(state.refreshToken).toBe("refresh-2");
    expect(state.user).toEqual(sampleUser);
  });

  it("clear wipes the entire session", () => {
    useAuthStore.getState().setSession("refresh-1", sampleUser);
    useAuthStore.getState().clear();

    const state = useAuthStore.getState();

    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("persists the refresh token and user to localStorage", () => {
    useAuthStore.getState().setSession("refresh-1", sampleUser);

    const raw = localStorage.getItem("aca-auth");

    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);

    expect(parsed.state.refreshToken).toBe("refresh-1");
    expect(parsed.state.user).toEqual(sampleUser);
    expect(parsed.state.accessToken).toBeUndefined();
  });
});