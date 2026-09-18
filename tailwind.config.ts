import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161C",
        slate1: "#1B2128",
        line: "#272F39",
        mist: "#8A98A8",
        paper: "#F2F4F7",
        signal: "#FFB020",
        go: "#2FBF71",
        stop: "#E5484D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
