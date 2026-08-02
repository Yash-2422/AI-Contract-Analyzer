import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, LogOut, Scale, Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contracts", label: "Contracts", icon: FileText },
  { to: "/search", label: "Search", icon: Search },
  { to: "/compare", label: "Compare", icon: Scale },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);

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
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ink-100 bg-white">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-medium text-ink-900">AI Contract Analyzer</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-100 px-5 py-4">
          <p className="truncate text-sm font-medium text-ink-900">{user?.full_name}</p>
          <p className="truncate text-xs text-ink-400">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-sm text-ink-400 hover:text-risk-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}