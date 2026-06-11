/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0b0f19',
        bgSecondary: '#161c2d',
        bgTertiary: '#1f293d',
        accentPrimary: '#6366f1',
        accentPrimaryHover: '#4f46e5',
        accentSuccess: '#10b981',
        accentDanger: '#ef4444',
        accentWarning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
