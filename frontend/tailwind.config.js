/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#252b24',
          lime: '#b9ee45',
          limeLight: '#eff5e6',
          limeBorder: '#a8df38',
          orange: '#ff6b35',
          orangeLight: '#fff2eb',
          bg: '#f8f9f6',
          border: '#e9ebe6',
          muted: '#969c92'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif']
      }
    },
  },
  plugins: [],
}
