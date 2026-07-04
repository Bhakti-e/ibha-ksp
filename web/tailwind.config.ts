import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Police-grade dark theme colors
        background: {
          DEFAULT: 'hsl(222, 47%, 11%)', // Deep blue-black
          secondary: 'hsl(217, 33%, 17%)', // Slightly lighter
        },
        foreground: {
          DEFAULT: 'hsl(213, 31%, 91%)', // Light text
          muted: 'hsl(217, 20%, 60%)', // Muted text
        },
        primary: {
          DEFAULT: 'hsl(210, 100%, 56%)', // Bright blue
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(217, 33%, 17%)',
          foreground: 'hsl(213, 31%, 91%)',
        },
        accent: {
          DEFAULT: 'hsl(38, 92%, 50%)', // Amber accent
          foreground: 'hsl(222, 47%, 11%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84%, 60%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        success: {
          DEFAULT: 'hsl(142, 71%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        warning: {
          DEFAULT: 'hsl(38, 92%, 50%)',
          foreground: 'hsl(222, 47%, 11%)',
        },
        border: 'hsl(217, 33%, 22%)',
        input: 'hsl(217, 33%, 22%)',
        ring: 'hsl(210, 100%, 56%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
