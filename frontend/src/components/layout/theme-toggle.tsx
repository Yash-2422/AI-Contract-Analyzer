import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme-store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
const toggleTheme = useThemeStore((s) => s.toggleTheme);  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-ink-200 bg-ink-50 transition-colors duration-300",
        "dark:border-ink-100 dark:bg-ink-50",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-paper shadow-sm transition-transform duration-300 ease-out",
          isDark && "translate-x-6",
        )}
      >
        <Sun
          className={cn(
            "absolute h-3.5 w-3.5 text-gold transition-all duration-300",
            isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-3.5 w-3.5 text-primary-400 transition-all duration-300",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
}