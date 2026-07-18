import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './renderer/src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        wire: 'var(--border-wire)',
        'wire-hover': 'var(--border-hover)',
        muted: 'var(--text-muted)',
        body: 'var(--text-body)',
        heading: 'var(--text-heading)',
        high: 'var(--text-high)',
        signal: 'var(--signal)',
        go: 'var(--go)',
        hold: 'var(--hold)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
    },
  },
} satisfies Config;

