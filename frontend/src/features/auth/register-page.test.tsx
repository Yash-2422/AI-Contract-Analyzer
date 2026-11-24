import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MockAdapter from "axios-mock-adapter";

import { RegisterPage } from "@/features/auth/register-page";
import { apiClient } from "@/lib/api-client";

function renderRegisterPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/register"]}>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("RegisterPage validation", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  it("shows field errors on empty submit without calling the API", async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mock.history.post).toHaveLength(0);
  });
});
