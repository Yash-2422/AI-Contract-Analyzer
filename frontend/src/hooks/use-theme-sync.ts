import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
}