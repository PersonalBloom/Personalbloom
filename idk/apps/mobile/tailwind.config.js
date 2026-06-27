/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bloom: {
          purple: '#A78BFA',
          pink:   '#F472B6',
          green:  '#34D399',
          dark:   '#0d0d18',
          card:   '#1a1028',
        }
      }
    }
  },
  plugins: [],
}
