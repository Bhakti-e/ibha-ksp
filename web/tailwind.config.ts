import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './screens/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS-variable–backed tokens (used in globals.css @layer components)
        background:          'hsl(var(--background) / <alpha-value>)',
        foreground:          'hsl(var(--foreground) / <alpha-value>)',
        'foreground-muted':  'hsl(var(--foreground-muted) / <alpha-value>)',
        surface:             'hsl(var(--surface) / <alpha-value>)',
        card:                'hsl(var(--card) / <alpha-value>)',
        'card-hover':        'hsl(var(--card-hover) / <alpha-value>)',
        border:              'hsl(var(--border) / <alpha-value>)',
        input:               'hsl(var(--input) / <alpha-value>)',
        ring:                'hsl(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT:    'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          hover:      'hsl(var(--primary-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'hsl(var(--surface) / <alpha-value>)',
        },
        muted: {
          DEFAULT:    'hsl(var(--surface) / <alpha-value>)',
          foreground: 'hsl(var(--foreground-muted) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(0 0% 100% / <alpha-value>)',
        },
        success:  'hsl(var(--success) / <alpha-value>)',
        warning:  'hsl(var(--warning) / <alpha-value>)',
        danger:   'hsl(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-up': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(37, 99, 235, 0)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-in':   'slide-in-up 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
