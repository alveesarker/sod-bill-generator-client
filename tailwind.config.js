/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        cream: '#f2efeb',
        ink: {
          900: '#1a1a1a',
          700: '#4a4a4a',
          600: '#757575',
          500: '#828282',
          400: '#999999',
          300: '#c4c4c4',
          200: '#e2e0dc',
          100: '#efedea',
        },
        brand: {
          DEFAULT: '#f28f1a',
          dark: '#d97c0e',
          soft: '#fdf1e0',
        },
        plum: {
          DEFAULT: '#6f2c89',
          soft: '#f3ebf7',
        },
        danger: {
          DEFAULT: '#f43f5e',
          soft: '#fff1f2',
        },
      },
    },
  },
  plugins: [],
}
