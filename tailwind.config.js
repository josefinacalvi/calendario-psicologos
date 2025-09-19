/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          'light': '#F0F2FF', // Un lila muy claro para fondos
          'DEFAULT': '#4A55A2', // El azul/índigo principal de Wellbin
          'dark': '#3A448A',   // Un tono más oscuro para hover
        },
        'success': '#28a745', // Un verde para mensajes de éxito
        'gray': {
          '100': '#f8f9fa',
          '200': '#e9ecef',
          '500': '#6c757d',
          '700': '#495057',
          '900': '#212529',
        }
      }
    },
  },
  plugins: [],
}