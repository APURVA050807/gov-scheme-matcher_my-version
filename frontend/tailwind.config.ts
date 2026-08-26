import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        paper: "#FAFAF8",
        primary: {
          DEFAULT: "#0B5FFF",
          50: "#EFF4FF",
          600: "#0B5FFF",
          700: "#0947C4",
        },
        success: "#0F9D58",
        warn: "#B45309",
        danger: "#C0292B",
        line: "#E4E4E0",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
