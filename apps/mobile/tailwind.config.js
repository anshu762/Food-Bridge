/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f8ee',
          100: '#e4efd4',
          200: '#cae0aa',
          300: '#97C459',
          400: '#7aad3a',
          500: '#5f8f2a',
          600: '#3B6D11',
          700: '#2d550d',
          800: '#24440a',
          900: '#1c3708',
        },
        accent: {
          50: '#fef8ee',
          100: '#fdf0d7',
          200: '#fae0ae',
          300: '#f7cb7b',
          400: '#f3b147',
          500: '#ef9720',
          600: '#BA7517',
          700: '#a56516',
          800: '#845018',
          900: '#6b4216',
        },
      },
    },
  },
};
