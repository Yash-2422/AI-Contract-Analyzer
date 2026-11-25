import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppLayout } from "@/components/layout/app-layout";
import { useThemeSync } from "@/hooks/use-theme-sync";
import { LogoMark } from "@/components/ui/logo";

// Route-level code splitting: each page's JS only downloads when the user
// navigates there, instead of one ~600kB bundle loading on first visit.
// LandingPage is NOT lazy - it's the entry point almost everyone hits
// first, so lazy-loading it would just add a network round-trip before
// showing anything.
import { LandingPage } from "@/pages/landing-page";

const LoginPage = lazy(() =>
  import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/register-page").then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/dashboard-page").then((m) => ({ default: m.DashboardPage })),
);
const ContractsPage = lazy(() =>
  import("@/pages/contracts-page").then((m) => ({ default: m.ContractsPage })),
);
const ContractDetailPage = lazy(() =>
  import("@/pages/contract-detail-page").then((m) => ({ default: m.ContractDetailPage })),
);
const ComparePage = lazy(() =>
  import("@/pages/compare-page").then((m) => ({ default: m.ComparePage })),
);
const SearchPage = lazy(() =>
  import("@/pages/search-page").then((m) => ({ default: m.SearchPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-sm text-ink-400">
        <LogoMark className="h-8 w-8 animate-pulse" />
        <span>Opening your workspace…</span>
      </div>
    </div>
  );
}

export function App() {
  useThemeSync();

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/:contractId" element={<ContractDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/search" element={<SearchPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  );
}
