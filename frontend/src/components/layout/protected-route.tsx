import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

/**
 * Gates any route behind an existing access token. This is a client-side
 * convenience only - it stops the UI from flashing protected content, it
 * is NOT the security boundary. The actual protection is every backend
 * endpoint's `Depends(get_current_user)` from Phase 2, which the API
 * enforces regardless of what this component does.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}