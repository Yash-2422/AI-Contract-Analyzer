import type { ReactNode } from "react";
import { ClauseShowcase } from "@/features/auth/clause-showcase";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-ink-900 lg:block">
        <ClauseShowcase />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-2xl font-medium text-ink-900">AI Contract Analyzer</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}