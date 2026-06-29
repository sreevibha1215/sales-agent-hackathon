/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        violet: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d8bfff',
          300: '#b892ff',
          400: '#9d6be8',
          500: '#935073',  // mauve
          600: '#502D55',  // deep plum — PRIMARY
          700: '#3d2241',
          800: '#2a172d',
          900: '#180d1a',
        },
        peach: {
          100: '#fdf6f0',
          200: '#fbe8d8',
          300: '#F6DBC0',  // soft peach
          400: '#f0c49a',
          500: '#e8a870',
        },
        cream: '#F8F4E9',
        surface:  '#120915',  // deepest background
        panel:    '#1c1020',  // sidebar
        card:     '#231428',  // card bg
        border:   '#3d2445',  // subtle border
        glow:     '#935073',  // for box-shadows
        muted:    '#9a7da8',  // secondary text
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'violet-gradient': 'linear-gradient(135deg, #502D55 0%, #935073 50%, #F6DBC0 100%)',
        'card-gradient':   'linear-gradient(145deg, #2a1830 0%, #1c1020 100%)',
        'glow-gradient':   'radial-gradient(ellipse at top, #502D55 0%, #12091500 70%)',
        'hero-gradient':   'radial-gradient(ellipse at 50% 0%, #502D5580 0%, #12091500 60%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(147, 80, 115, 0.25)',
        'glow-md':  '0 0 24px rgba(147, 80, 115, 0.35)',
        'glow-lg':  '0 0 48px rgba(147, 80, 115, 0.45)',
        'glow-xl':  '0 0 80px rgba(80, 45, 85, 0.6)',
        'card':     '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(147,80,115,0.15)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(147,80,115,0.35), 0 0 20px rgba(147,80,115,0.15)',
        'btn':      '0 4px 16px rgba(147,80,115,0.4)',
        'btn-hover':'0 6px 24px rgba(147,80,115,0.6)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'fade-up':    'fadeUp 0.4s ease-out forwards',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(147,80,115,0.3)' },
          '50%':      { boxShadow: '0 0 32px rgba(147,80,115,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};