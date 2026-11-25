import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Wordmark } from "@/components/ui/logo";
import { PageTransition } from "@/components/ui/motion";
import { Tooltip } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contracts", label: "Contracts", icon: FileText },
  { to: "/search", label: "Search", icon: Search },
  { to: "/compare", label: "Compare", icon: Scale },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contracts": "Contracts",
  "/search": "Search",
  "/compare": "Compare",
};

function getInitials(name?: string | null) {
  if (!name) return "AC";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "AC";
}

function SidebarContent({
  scope,
  onNavigate,
}: {
  scope: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);
  const reduceMotion = useReducedMotion();

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
    <div className="flex h-full min-h-0 flex-col bg-sidebar">
      <div className="flex h-[4.75rem] shrink-0 items-center justify-between border-b border-sidebar-border px-5 lg:px-6">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="min-w-0 rounded-xl transition-all duration-300 hover:-translate-y-px hover:opacity-85"
          aria-label="AI Contract Analyzer dashboard"
        >
          <Wordmark />
        </Link>

        {scope === "mobile" && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation"
            className="rounded-full p-2 text-ink-400 transition-all duration-200 hover:bg-sidebar-hover hover:text-ink-900 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-6">
        <p className="px-3 font-mono text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ink-400">
          Workspace
        </p>

        <nav aria-label="Primary" className="mt-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[0.8125rem] font-medium transition-all duration-300",
                  isActive
                    ? "border-primary/15 bg-sidebar-active text-ink-900 shadow-sm"
                    : "border-transparent text-ink-400 hover:-translate-y-px hover:border-sidebar-border hover:bg-sidebar-hover hover:text-ink-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId={`sidebar-active-${scope}`}
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent"
                      initial={false}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : {
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                            mass: 0.7,
                          }
                      }
                    />
                  )}

                  <Icon
                    className={cn(
                      "relative h-[1.05rem] w-[1.05rem] transition-all duration-300",
                      isActive
                        ? "text-accent"
                        : "text-ink-400 group-hover:translate-x-0.5 group-hover:text-ink-600",
                    )}
                    strokeWidth={isActive ? 2 : 1.8}
                  />

                  <span className="relative">{label}</span>

                  {isActive && (
                    <span className="relative ml-auto flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-400">
                        Open
                      </span>
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="my-6 h-px bg-sidebar-border/70" />

        <p className="px-3 font-mono text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ink-400">
          Quick action
        </p>

        <Link
          to="/contracts#upload"
          onClick={onNavigate}
          className="group mt-3 flex items-center gap-3 rounded-xl border border-dashed border-sidebar-border bg-sidebar/60 p-3.5 transition-all duration-300 hover:-translate-y-px hover:border-primary/35 hover:bg-sidebar-hover"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
            <FilePlus2 className="h-4 w-4" strokeWidth={1.8} />
          </span>

          <span className="min-w-0">
            <span className="block text-xs font-semibold text-ink-900">
              Analyze a contract
            </span>
            <span className="mt-0.5 block text-[0.6875rem] text-ink-400">
              PDF or DOCX
            </span>
          </span>

          <ChevronRight className="ml-auto h-3.5 w-3.5 text-ink-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
        </Link>
      </div>

      <div className="shrink-0 border-t border-sidebar-border p-4 lg:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brass/25 bg-brass/10 font-display text-xs font-semibold text-brass">
            {getInitials(user?.full_name)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink-900">
              {user?.full_name ?? "Your account"}
            </p>
            <p className="truncate text-[0.6875rem] text-ink-400">
              {user?.email}
            </p>
          </div>

          <Tooltip content="Sign out">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-ink-400 transition-all duration-200 hover:bg-risk-50 hover:text-risk-600 active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}


export function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  const isContractDetail = /^\/contracts\/[^/]+$/.test(location.pathname);
  const pageTitle = isContractDetail
    ? "Contract detail"
    : (PAGE_TITLES[location.pathname] ?? "Workspace");

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only z-[80] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border bg-sidebar lg:block">
          <SidebarContent scope="desktop" />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-ink-100 bg-canvas/90 backdrop-blur-md lg:hidden">
            <div className="flex h-16 items-center justify-between gap-3 px-4">
              <Link to="/dashboard" className="min-w-0" aria-label="Dashboard">
                <Wordmark subtitle={false} />
              </Link>
              <div className="flex shrink-0 items-center gap-1.5">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                  aria-expanded={mobileOpen}
                  className="rounded-full border border-ink-100 bg-surface p-2 text-ink-600 transition-colors hover:text-ink-900"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <header className="sticky top-0 z-20 hidden h-[4.5rem] shrink-0 items-center justify-between border-b border-ink-100 bg-canvas/85 px-8 backdrop-blur-md lg:flex xl:px-10">
            <div className="flex min-w-0 items-center gap-2 text-xs">
              <span className="font-medium text-ink-400">Workspace</span>
              <ChevronRight className="h-3 w-3 text-ink-200" />
              <span className="truncate font-medium text-ink-900">{pageTitle}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-ink-100 bg-surface px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-400 xl:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                AI workspace
              </span>
              <ThemeToggle />
            </div>
          </header>

          <main id="main-content" className="min-w-0 flex-1">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              tabIndex={-1}
              initial={reduceMotion ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 w-[min(19rem,88vw)] border-r border-sidebar-border bg-sidebar shadow-lift focus:outline-none"
            >
              <SidebarContent scope="mobile" onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
