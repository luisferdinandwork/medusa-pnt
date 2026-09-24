// Same visual identity as apps/storefront (ink / paper / red, Archivo Black + Inter).
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#141210", 700: "#2B2622", 500: "#4A443E" },
        paper: { DEFAULT: "#F5F3EE", 100: "#EDEAE2", 200: "#E0DBD1" },
        brand: { DEFAULT: "#E8412B", 600: "#D0331F", 700: "#A62819", 50: "#FDEDEA" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Arial Black", "sans-serif"],
      },
    },
  },
  plugins: [],
}
