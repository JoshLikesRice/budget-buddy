/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fixed bucket colors used consistently across the app
        needs: {
          DEFAULT: "#2563eb",
          soft: "#dbeafe",
          text: "#1e40af",
        },
        wants: {
          DEFAULT: "#f59e0b",
          soft: "#fef3c7",
          text: "#b45309",
        },
        savings: {
          DEFAULT: "#10b981",
          soft: "#d1fae5",
          text: "#047857",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#475569",
          faint: "#94a3b8",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)",
        lift: "0 10px 30px rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
