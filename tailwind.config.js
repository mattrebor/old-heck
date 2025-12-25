export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Quicksand", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Felt green palette (card table aesthetic) - MORE VIBRANT
        felt: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        // Bidding phase - VIBRANT blue/purple tones
        bid: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        // Success colors
        success: {
          50: "#d1fae5",
          500: "#10b981",
          600: "#34d399",
        },
        // Danger colors
        danger: {
          50: "#fee2e2",
          500: "#ef4444",
          600: "#f87171",
        },
        // Gold/accent colors
        gold: {
          500: "#f59e0b",
        },
        // Accent colors - MORE VIBRANT
        accent: {
          500: "#a855f7",
        },
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
