/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./App.{js,jsx}', './components/**/*.{js,jsx}', './screens/**/*.{js,jsx}', './navigation/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f7ff',
          100: '#e5efff',
          200: '#c7dbff',
          300: '#9abfff',
          400: '#6d9eff',
          500: '#3e77ff',
          600: '#2157f2',
          700: '#1f46d1',
          800: '#203ba9',
          900: '#213686'
        }
      }
    },
  },
  plugins: [],
};
