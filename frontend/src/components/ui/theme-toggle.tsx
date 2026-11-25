import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  label = false,
}: {
  className?: string;
  label?: boolean;
}) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const reduceMotion = useReducedMotion();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "group relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink-100 bg-surface text-ink-600 shadow-sm transition-all duration-300 hover:border-ink-200 hover:text-ink-900",
        label && "w-auto gap-2 px-3",
        className,
      )}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={reduceMotion ? false : { rotate: -80, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { rotate: 80, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-champagne" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
      {label && (
        <span className="text-xs font-medium tracking-wide">{isDark ? "Light" : "Dark"}</span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 ring-1 ring-inset ring-brass/40 transition-opacity duration-300 group-hover:opacity-100" />
    </button>
  );
}
