/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores de The Safe Spot
        'brand-cream': '#F8F3ED', // [cite: 391]
        'brand-peach': '#F2D6C1', // [cite: 390]
        'brand-blue': '#5B8AD1',   // [cite: 392]
        'brand-orange': '#E36E2D', // [cite: 393]
        'brand-blue-light': '#91B2CA', // [cite: 387]
      }
    },
  },
  plugins: [],
}