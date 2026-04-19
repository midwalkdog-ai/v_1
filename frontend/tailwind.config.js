/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        pulse: {
          bg: '#0A0B0F',
          card: '#111318',
          border: '#1E2130',
          accent: '#00E5A0',
          accentDim: '#00E5A015',
          warn: '#FF6B35',
          crit: '#FF2D55',
          blue: '#4A9EFF',
          text: '#E8EAF0',
          muted: '#6B7280',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.35s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(0,229,160,0.15)' }, '50%': { boxShadow: '0 0 20px 4px rgba(0,229,160,0.25)' } },
      },
    },
  },
  plugins: [],
};
