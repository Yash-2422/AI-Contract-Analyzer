import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Proxies API calls during local dev so the frontend can call
    // relative /api/... paths instead of hardcoding the backend origin -
    // matches how it'll typically sit behind a reverse proxy in production.
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Splits the React runtime into its own cacheable chunk, separate
        // from app code. A deploy that only changes app logic won't force
        // users to re-download React - this is purely a long-term caching
        // win, not a change to what loads on first visit.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});