/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        vip: {
          silver: '#94a3b8',
          gold: '#f59e0b',
          platinum: '#06b6d4',
          diamond: '#8b5cf6',
        }
      }
    },
  },
  plugins: [],
}
