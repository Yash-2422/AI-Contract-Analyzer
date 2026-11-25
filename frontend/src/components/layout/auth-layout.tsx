import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClauseShowcase } from "@/features/auth/clause-showcase";
import { LogoMark } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.06fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/4 h-[30rem] w-[30rem] rounded-full border border-champagne/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-1/4 h-[22rem] w-[22rem] rounded-full border border-champagne/10"
        />

        <div className="relative flex min-h-screen flex-col p-8 xl:p-12">
          <Link to="/" className="flex items-center gap-3" aria-label="AI Contract Analyzer home">
            <LogoMark className="h-10 w-10 bg-primary-foreground text-primary shadow-none" />
            <span className="min-w-0">
              <span className="block font-display text-lg font-medium leading-tight tracking-[-0.01em]">
                AI Contract Analyzer
              </span>
              <span className="mt-0.5 block font-mono text-[0.58rem] uppercase tracking-[0.2em] text-primary-foreground/70">
                Contract intelligence
              </span>
            </span>
          </Link>

          <div className="my-auto py-12">
            <ClauseShowcase />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[0.6875rem] text-primary-foreground/65">
            <span>Private by design. Your contracts stay yours.</span>
            <span className="font-mono uppercase tracking-[0.16em]">Est. 2025</span>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 lg:hidden"
            aria-label="AI Contract Analyzer home"
          >
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-[0.95rem] font-medium text-ink-900">
              AI Contract Analyzer
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-400 sm:inline">
              Secure client access
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4 sm:px-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>

        <div className="px-5 pb-6 text-center text-[0.6875rem] text-ink-400 sm:px-8">
          By continuing, you agree to treat uploaded documents with the care they deserve.
        </div>
      </main>
    </div>
  );
}
