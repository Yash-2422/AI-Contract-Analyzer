import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--color-ink-900) / <alpha-value>)",
          50: "rgb(var(--color-ink-50) / <alpha-value>)",
          100: "rgb(var(--color-ink-100) / <alpha-value>)",
          200: "rgb(var(--color-ink-200) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
        },

        paper: "rgb(var(--color-paper) / <alpha-value>)",

        surface: "rgb(var(--color-surface) / <alpha-value>)",

        emerald: {
          DEFAULT: "rgb(var(--color-emerald-600) / <alpha-value>)",
          50: "rgb(var(--color-emerald-50) / <alpha-value>)",
          100: "rgb(var(--color-emerald-100) / <alpha-value>)",
          600: "rgb(var(--color-emerald-600) / <alpha-value>)",
          700: "rgb(var(--color-emerald-700) / <alpha-value>)",
        },

        risk: {
          DEFAULT: "rgb(var(--color-risk-600) / <alpha-value>)",
          50: "rgb(var(--color-risk-50) / <alpha-value>)",
          100: "rgb(var(--color-risk-100) / <alpha-value>)",
          600: "rgb(var(--color-risk-600) / <alpha-value>)",
        },

        gold: "rgb(var(--color-gold) / <alpha-value>)",
      },

      fontFamily: {
        display: ["Newsreader", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },

      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },

  plugins: [],
};

export default config;