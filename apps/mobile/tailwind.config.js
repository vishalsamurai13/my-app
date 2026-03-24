/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101418',
        surface: '#f5f0e8',
        sand: '#e6dccd',
        ember: '#d65a31',
        moss: '#345c4d',
        line: '#d7c9b5',
      },
    },
  },
  plugins: [],
};
