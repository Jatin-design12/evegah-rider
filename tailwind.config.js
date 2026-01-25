/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      /* =======================
         BRAND COLORS (DO NOT REMOVE)
      ======================= */
      colors: {
        brand: {
          dark: "#2A195C",     // Primary Purple (Logo)
          accent: "#CDFF64",   // Accent Green
          light: "#E7E0FF",
          soft: "#D4C6FF",
          medium: "#A286DC",
        },

        /* =======================
           SEMANTIC THEME COLORS
           (USE THESE IN UI)
        ======================= */
        evegah: {
          bg: "#F6F7FB",        // App background
          card: "#FFFFFF",     // Card background
          border: "#E5E7EB",   // Borders / dividers
          text: "#111827",     // Primary text
          muted: "#6B7280",    // Secondary text
          primary: "#2A195C",  // Maps to brand.dark
          accent: "#CDFF64",   // Maps to brand.accent
        },
      },

      /* =======================
         TYPOGRAPHY
      ======================= */
      fontFamily: {
        primary: ["Metropolis", "Poppins", "sans-serif"],
      },

      /* =======================
         BORDER RADIUS
      ======================= */
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },

      /* =======================
         SHADOWS (LIGHT THEME)
      ======================= */
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
        card: "0 2px 10px rgba(0,0,0,0.04)",
      },
    },
  },

  plugins: [],
};
