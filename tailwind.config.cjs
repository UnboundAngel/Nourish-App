/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        handwritten: ['Indie Flower', 'cursive'],
      },
      colors: {
        'green-primary': '#2D5A27',
        'orange-accent': '#D97706',
        'red-issue': '#EA580C',
        'dark-sidebar': '#1E293B',
        'dark-bg': '#0F172A',
      },
    },
  },
  plugins: [],
}