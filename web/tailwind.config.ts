import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Institutional law-enforcement palette
        navy: {
          DEFAULT: '#0F172A',  // deep navy — navbar, headers
          light:   '#1E293B',  // slightly lighter navy — nav hover
          border:  '#334155',  // nav border
        },
        surface: {
          DEFAULT: '#F1F5F9',  // slate-100 — page background
          card:    '#FFFFFF',  // white — cards, tables, panels
          muted:   '#F8FAFC',  // off-white — alternate row / subtle bg
        },
        ink: {
          DEFAULT:  '#0F172A', // near-black primary text
          secondary:'#475569', // slate-600 — secondary text
          muted:    '#94A3B8', // slate-400 — placeholder, metadata
        },
        accent: {
          DEFAULT: '#1D4ED8',  // blue-700 — primary action
          hover:   '#1E40AF',  // blue-800
          light:   '#EFF6FF',  // blue-50 — tinted bg for accents
          border:  '#BFDBFE',  // blue-200
        },
        status: {
          success:      '#16A34A', // green-600
          successBg:    '#F0FDF4', // green-50
          successBorder:'#BBF7D0', // green-200
          warning:      '#D97706', // amber-600
          warningBg:    '#FFFBEB', // amber-50
          warningBorder:'#FDE68A', // amber-200
          danger:       '#DC2626', // red-600
          dangerBg:     '#FEF2F2', // red-50
          dangerBorder: '#FECACA', // red-200
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card:  '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        panel: '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        nav:   '0 1px 0 0 #334155',
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
