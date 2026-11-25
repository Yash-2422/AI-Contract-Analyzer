import type { Config } from "tailwindcss";

/**
 * Design tokens live in src/index.css as `--color-*` RGB triplets so the
 * light and dark themes can be tuned independently. Every color utility
 * below resolves through those variables - no component should need a
 * hard-coded hex value.
 */
const config: Config = {
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",

        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          raised: "rgb(var(--color-surface-raised) / <alpha-value>)",
          sunken: "rgb(var(--color-surface-sunken) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "rgb(var(--color-sidebar) / <alpha-value>)",
          hover: "rgb(var(--color-sidebar-hover) / <alpha-value>)",
          active: "rgb(var(--color-sidebar-active) / <alpha-value>)",
          border: "rgb(var(--color-sidebar-border) / <alpha-value>)",
        },

        ink: {
          DEFAULT: "rgb(var(--color-ink-900) / <alpha-value>)",
          50: "rgb(var(--color-ink-50) / <alpha-value>)",
          100: "rgb(var(--color-ink-100) / <alpha-value>)",
          200: "rgb(var(--color-ink-200) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
        },

        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          soft: "rgb(var(--color-primary-soft) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },

        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
        },

        brass: "rgb(var(--color-brass) / <alpha-value>)",
        copper: "rgb(var(--color-copper) / <alpha-value>)",
        champagne: "rgb(var(--color-champagne) / <alpha-value>)",

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

        chat: {
          user: "rgb(var(--color-chat-user) / <alpha-value>)",
          "user-foreground": "rgb(var(--color-chat-user-foreground) / <alpha-value>)",
          assistant: "rgb(var(--color-chat-assistant) / <alpha-value>)",
          "assistant-foreground": "rgb(var(--color-chat-assistant-foreground) / <alpha-value>)",
        },
      },

      fontFamily: {
        display: ["Fraunces", "Newsreader", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        "display-sm": ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        "display-md": ["3rem", { lineHeight: "1.04", letterSpacing: "-0.03em" }],
        "display-lg": ["3.75rem", { lineHeight: "0.99", letterSpacing: "-0.035em" }],
      },

      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },

      boxShadow: {
        card: "0 1px 2px rgb(31 38 33 / 0.04), 0 8px 24px -18px rgb(31 38 33 / 0.24)",
        lift: "0 2px 4px rgb(31 38 33 / 0.04), 0 22px 45px -30px rgb(31 38 33 / 0.36)",
        inset: "inset 0 1px 0 rgb(255 255 255 / 0.05)",
      },

      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },

      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "soft-pulse": "soft-pulse 1.8s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },

  plugins: [],
};

export default config;
