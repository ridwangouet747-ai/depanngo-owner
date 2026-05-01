import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:       "#FF6600",
          "primary-hover": "#E55A00",
          navy:          "#0C1A2B",
          "navy-light":  "#1A2D45",
          dark:          "#060E18",
        },
        glass: {
          white:  "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.12)",
          card:   "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.15)",
        }
      },
      backdropBlur: {
        xs: "4px",
        glass: "20px",
      },
      boxShadow: {
        glass:        "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-sm":   "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glow-orange":"0 0 30px rgba(255,102,0,0.4)",
        "glow-sm":    "0 0 15px rgba(255,102,0,0.25)",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;