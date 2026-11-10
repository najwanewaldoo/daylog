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
        canvas: {
          DEFAULT: "#F9F8F5",
          subtle: "#F3F1EC",
          card: "#FFFFFF",
          cardMuted: "#F7F6F2",
          border: "#E7E5DF",
          borderLight: "#EFECE6",
        },
        ink: {
          DEFAULT: "#18202A",
          muted: "#4A5565",
          subtle: "#7E8B9B",
          faint: "#A5B0BE",
        },
        sage: {
          50: "#F4F7F6",
          100: "#E3ECE9",
          200: "#C7D8D3",
          300: "#A3BEB6",
          500: "#4F766C",
          600: "#3F6057",
          700: "#324C45",
        },
        slateBlue: {
          50: "#F2F5F8",
          100: "#E1E8EE",
          200: "#C3D1DC",
          500: "#395873",
          600: "#2B4358",
          700: "#1F3140",
        },
        warmAmber: {
          50: "#FEF9EE",
          100: "#FCF0D3",
          500: "#B87528",
          600: "#995C1B",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
