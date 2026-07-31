import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

/**
 * Placeholder landing page after login - confirms the auth flow works end
 * to end (token issued, /auth/me resolved, route protected). The real
 * dashboard (recent contracts, risk distribution, upload flow, etc. from
 * Phase 7's /dashboard endpoint) is built out in Phase 9.
 */
export function DashboardPlaceholder() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  async function handleLogout() {
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refresh_token: refreshToken });
      }
    } finally {
      clear();
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl font-medium text-ink-900">AI Contract Analyzer</p>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <div className="mt-12 rounded-lg border border-ink-100 bg-white p-8 shadow-sm">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-400">
            Signed in as
          </p>
          <p className="mt-2 font-display text-xl text-ink-900">{user?.full_name}</p>
          <p className="text-sm text-ink-400">{user?.email}</p>

          <div className="mt-8 rounded-md border border-dashed border-ink-200 p-6 text-center">
            <p className="text-sm text-ink-400">
              The full dashboard — recent contracts, risk distribution, upload — lands in
              Phase 9.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}