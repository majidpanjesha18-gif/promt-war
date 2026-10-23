import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#092e18",
        },
        forest: {
          50: "#f2f7f4",
          100: "#dfeee4",
          200: "#c1ddcb",
          300: "#98c4aa",
          400: "#6aa583",
          500: "#478763",
          600: "#346b4e",
          700: "#29553f",
          800: "#224433",
          900: "#1b372a",
          950: "#0c1f17",
        },
        surface: {
          light: "#FBFDFB",
          card: "#FFFFFF",
          muted: "#F4F6F4",
          border: "#E2E8E2",
        },
        charcoal: {
          DEFAULT: "#18211C",
          muted: "#4A5568",
          subtle: "#718096",
        },
        lime: {
          accent: "#84CC16",
          dark: "#65A30D",
          light: "#BEF264",
        }
      },
    },
  },
  plugins: [],
};
export default config;
