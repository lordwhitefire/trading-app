/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: "#FACC15",
        "accent-hover": "#FDE047",
        surface: "#0D0D0D",
        "surface-elevated": "#141414",
        border: "#1F1F1F",
        "border-hover": "#2E2E2E",
        "text-primary": "#FFFFFF",
        "text-secondary": "#9CA3AF",
        "text-muted": "#4B5563",
        success: "#22C55E",
        danger: "#EF4444",
        "input-bg": "#111111",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        mono: ["monospace"],
      },
    },
  },
  plugins: [],
}