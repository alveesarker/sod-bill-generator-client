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
        ink: {
          50: '#1A1A1A',
          100: '#1A1A1A',
          200: '#1A1A1A',
          300: '#1A1A1A',
          400: '#757575',
          500: '#828282',
          600: '#999999',
          700: '#999999',
          800: '#ffffff',
          900: '#ffffff',
          950: '#ffffff',
        },
        gold: {
          100: '#f2efeb',
          300: '#f28f1a',
          400: '#f28f1a',
          500: '#f28f1a',
          600: '#f28f1a',
        },
        jade: {
          400: '#6f2c89',
          500: '#6f2c89',
          600: '#6f2c89',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        }
      }
    }
  },
  plugins: []
}
