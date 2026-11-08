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
          greenDeep: "#1B5E20",
          green: "#2E7D32",
          greenLight: "#43A047",
          blueDeep: "#0D3B80",
          blue: "#1565C0",
          blueLight: "#1E88E5",
          teal: "#00796B",
          tealMid: "#0F6A7A",
          bg: "#EFF6F3",
          cardBorder: "#D3E4DB",
          innerBg: "#F5FAF7",
          ash: "#E2E7E5",
          textDark: "#0F2A3D",
          textMuted: "#5F7387",
          red: "#D32F2F",
        }
      },
      fontFamily: {
        serif: ['"Noto Serif Bengali"', 'serif'],
      }
    },
  },
  plugins: [],
}