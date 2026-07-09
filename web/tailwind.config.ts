import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variable driven RGB — supports /opacity modifiers
        navy: {
          DEFAULT: 'rgb(var(--nav) / <alpha-value>)',
          light:   'rgb(var(--nav-light) / <alpha-value>)',
          border:  'rgb(var(--nav-border) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          card:    'rgb(var(--card) / <alpha-value>)',
          muted:   'rgb(var(--muted) / <alpha-value>)',
        },
        ink: {
          DEFAULT:   'rgb(var(--ink) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary) / <alpha-value>)',
          muted:     'rgb(var(--ink-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover:   'rgb(var(--accent-hover) / <alpha-value>)',
          light:   'rgb(var(--accent-light) / <alpha-value>)',
          border:  'rgb(var(--accent-border) / <alpha-value>)',
        },
        status: {
          success:      'rgb(var(--accent) / <alpha-value>)',
          successBg:    'rgb(var(--accent-light) / <alpha-value>)',
          successBorder:'rgb(var(--accent-border) / <alpha-value>)',
          warning:      'rgb(var(--accent-hover) / <alpha-value>)',
          warningBg:    'rgb(var(--accent-light) / <alpha-value>)',
          warningBorder:'rgb(var(--accent-border) / <alpha-value>)',
          danger:       '#FF6B6B',
          dangerBg:     '#3A1414',
          dangerBorder: '#8A1A1A',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        panel: '0 4px 12px -2px rgb(0 0 0 / 0.5), 0 2px 6px -2px rgb(0 0 0 / 0.35)',
        nav:   '0 1px 0 0 var(--nav-border)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
