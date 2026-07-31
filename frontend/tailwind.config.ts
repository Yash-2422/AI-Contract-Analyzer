import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens - see README "Design system" section for rationale.
        ink: {
          DEFAULT: "#1B2430",
          50: "#F5F6F7",
          100: "#E7E9EC",
          200: "#C7CCD3",
          400: "#6B7480",
          600: "#3D4552",
          900: "#1B2430",
        },
        paper: "#FAF8F3",
        emerald: {
          DEFAULT: "#1F5D4C",
          50: "#EAF3F0",
          100: "#CFE3DC",
          600: "#1F5D4C",
          700: "#164338",
        },
        risk: {
          DEFAULT: "#C1440E",
          50: "#FBEEE7",
          100: "#F5D3C2",
          600: "#C1440E",
        },
        gold: "#B8862E",
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
} satisfies Config;