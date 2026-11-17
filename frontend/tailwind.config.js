/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          200: '#bdcfe3',
          300: '#91b1d0',
          400: '#608db9',
          500: '#3e6fa1',
          600: '#2f5685',
          700: '#27466d',
          800: '#1e3553',
          900: '#0f1d31',
          950: '#091220',
        },
        brand: {
          blue: '#1d4ed8',
          accent: '#2563eb',
          light: '#eff6ff',
          dark: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
