/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        offroad: {
          black: '#1a1a1a', // Цвет шин
          dark: '#2d2d2d',  // Асфальт
          orange: '#f97316', // Оранжевый
          mud: '#5c4033',   // Грязь
          gray: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'], // Основной текст
        display: ['"Russo One"', 'sans-serif'], // Заголовки (Offroad Style)
      }
    },
  },
  plugins: [],
}