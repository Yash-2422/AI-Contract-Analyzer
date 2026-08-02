import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { LoginPage } from "@/features/auth/login-page";

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    useAuthStore.getState().clear();
  });

  it("renders the email and password fields", () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows validation errors on empty submit without calling the API", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    let loginCalled = false;
    mock.onPost("/auth/login").reply(() => {
      loginCalled = true;
      return [200, {}];
    });

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(loginCalled).toBe(false);
  });

  it("shows the server's error message on failed login", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    mock.onPost("/auth/login").reply(401, {
      error: "http_error",
      message: "Incorrect email or password.",
    });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
  });

  it("stores the session on successful login", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    mock.onPost("/auth/login").reply(200, {
      access_token: "access-123",
      refresh_token: "refresh-123",
      token_type: "bearer",
    });
    mock.onGet("/auth/me").reply(200, {
      id: "user-1",
      email: "test@example.com",
      full_name: "Test User",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "supersecret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("access-123");
    });
    expect(useAuthStore.getState().user?.email).toBe("test@example.com");
  });
});