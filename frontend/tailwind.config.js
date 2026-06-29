/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c0cfff',
          300: '#93aeff',
          400: '#6585fd',
          500: '#4361f9',
          600: '#2d3fee',
          700: '#2530d4',
          800: '#2229ac',
          900: '#222888',
        },
        surface: '#0f1117',
        panel: '#161b27',
        card: '#1e2535',
        border: '#2a3144',
        muted: '#8892a4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
