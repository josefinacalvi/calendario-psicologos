/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        'brand-cream': '#F8F3ED',
        'brand-peach': '#F2D6C1',
        'brand-blue': '#5B8AD1',
        'brand-orange': '#E36E2D',
        'brand-blue-light': '#91B2CA',
      }
    },
  },
  plugins: [],
}