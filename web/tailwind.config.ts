import type { Config } from 'tailwindcss'

const config: Config = {
  // NO darkMode:'class' — we use a fixed dark theme, no toggling needed.
  // Removing it means all dark-variant classes still work if we explicitly
  // write slate-*/blue-* etc., and avoids the class-injection race condition.
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Roboto Mono', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37,99,235,0.5)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(37,99,235,0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.25s ease-out',
        'slide-up':   'slide-up 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
