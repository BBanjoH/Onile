import type { Config } from "tailwindcss";

// Onile is built for landlords who are often elderly and not confident with
// technology. Two deliberate choices live in this file:
//
// 1. The whole type scale is shifted up. Tailwind's defaults (text-sm =
//    14px) are too small to read comfortably on a phone at arm's length.
//    Redefining the scale here lifts every screen at once, and combines
//    with the user's own text-size setting in globals.css.
// 2. The muted greys are darkened. Tailwind's gray-400/500 on white fall
//    near the bottom of the WCAG AA contrast threshold; ageing eyes lose
//    contrast sensitivity long before they lose acuity, so secondary text
//    here is a full step darker than stock.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
        gray: {
          400: "#6b7280",
          500: "#4b5563",
        },
      },
      fontSize: {
        xs: ["0.9375rem", { lineHeight: "1.4rem" }],
        sm: ["1rem", { lineHeight: "1.55rem" }],
        base: ["1.0625rem", { lineHeight: "1.65rem" }],
        lg: ["1.1875rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.625rem", { lineHeight: "2.15rem" }],
        "3xl": ["2rem", { lineHeight: "2.5rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
