/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        da: {
          greenDeep: "#14532D",
          green: "#2E7D32",
          blueDeep: "#0B2F6B",
          blue: "#1565C0",
          greenBright: "#43A047",
          blueBright: "#1E88E5",
          teal: "#00796B",
          tealMid: "#0F6A7A",
          red: "#D32F2F",
          gold: "#C9A227",
          bg: "#F4F8F6",
          innerBg: "#F8FBF9",
          cardBorder: "#DCE8E2",
          ash: "#E2E7E5",
          textDark: "#0B1F33",
          textMuted: "#5F7387",
          depotNavy: "#0A2540",
          depotBlue: "#1565C0",
          depotAmber: "#F59E0B",
          depotBg: "#F1F5F9",
        }
      },
      fontFamily: {
        serif: ['"Noto Serif Bengali"', 'serif'],
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.625rem',
        'lg': '0.75rem',
        'xl': '0.875rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 14px -4px rgba(11, 47, 107, 0.08)',
        'green-soft': '0 4px 14px -4px rgba(46, 125, 50, 0.15)',
        'blue-soft': '0 4px 14px -4px rgba(21, 101, 192, 0.15)',
        'gold-soft': '0 4px 14px -4px rgba(201, 162, 39, 0.15)',
      }
    },
  },
  plugins: [],
}