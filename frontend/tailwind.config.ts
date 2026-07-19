/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep indigo + electric violet
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Dark surface scale
        surface: {
          0: '#0a0a0f',   // deepest bg
          1: '#111118',   // page bg
          2: '#16161f',   // card bg
          3: '#1e1e2a',   // elevated card
          4: '#252535',   // hover/active
          5: '#2e2e42',   // border
        },
        // Semantic colors
        success: {
          DEFAULT: '#22c55e',
          muted: 'rgba(34,197,94,0.12)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245,158,11,0.12)',
        },
        danger: {
          DEFAULT: '#ef4444',
          muted: 'rgba(239,68,68,0.12)',
        },
        info: {
          DEFAULT: '#38bdf8',
          muted: 'rgba(56,189,248,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', '0.875rem'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(99,102,241,0.3)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.2)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-dark': 'linear-gradient(180deg, #16161f 0%, #0a0a0f 100%)',
        'mesh': `radial-gradient(at 40% 20%, hsla(252,80%,60%,0.08) 0px, transparent 50%),
                 radial-gradient(at 80% 0%, hsla(189,75%,60%,0.05) 0px, transparent 50%),
                 radial-gradient(at 0% 50%, hsla(355,80%,60%,0.05) 0px, transparent 50%)`,
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-brand': 'pulseBrand 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseBrand: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(99,102,241,0)' } },
      },
    },
  },
  plugins: [],
};
