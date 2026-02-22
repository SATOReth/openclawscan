import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0c0c',
        card: '#111111',
        border: '#1c1c1c',
        hl: '#181818',
        faint: '#222222',
        ghost: '#333333',
        dim: '#666666',
        tx: '#d4d4d4',
        bright: '#f0f0f0',
        accent: '#22c55e',
        'accent-dim': '#16a34a',
        amber: '#eab308',
        'c-red': '#ef4444',
        'c-blue': '#60a5fa',
        purple: '#a78bfa',
        cyan: '#22d3ee',
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'SF Mono'", "'Consolas'", 'monospace'],
      },
      keyframes: {
        blink: { '50%': { opacity: '0' } },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
