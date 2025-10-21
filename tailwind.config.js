/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'komaba-background': '#f0f0f0',
        'komaba-orange': '#EC6F3B',
        'komaba-orange-light': 'rgba(236,111,59,.25)',
        'komaba-header': '#2F4F4F',
        'komaba-teal': '#00796B',
        'ut-blue': '#0B8BEE',
        'ginkgo-yellow': '#FFCD00',
      }
    },
  },
  plugins: [],
}