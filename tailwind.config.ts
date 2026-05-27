import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        sacred: {
          50: "#f8f6f3",
          100: "#f0ebe4",
          200: "#e0d5c8",
          300: "#cdbaa5",
          400: "#b89a80",
          500: "#a88266",
          600: "#9b725a",
          700: "#815d4b",
          800: "#6a4d41",
          900: "#574037",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(234, 179, 8, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(234, 179, 8, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
