import { useEffect } from "react";
import { useThemeStore } from "@/store/theme-store";

/**
 * Keeps the document in sync with the persisted theme. The tiny inline
 * script in index.html applies the same decision before React boots, so
 * there is no light flash on reload.
 */
export function useThemeSync() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.classList.toggle("dark", isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.style.backgroundColor = isDark ? "#101B19" : "#F3F0E8";

    const themeColorMeta = document.querySelector<HTMLMetaElement>("#theme-color-meta");
    if (themeColorMeta) {
      themeColorMeta.content = isDark ? "#101B19" : "#F3F0E8";
    }
  }, [theme]);
}
