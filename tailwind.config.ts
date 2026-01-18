import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Green classes for strong candidates
    'text-green-700',
    'text-green-400',
    'bg-green-50',
    'bg-green-900/20',
    'border-green-200',
    'border-green-800',
    // Amber classes for moderate candidates
    'text-amber-700',
    'text-amber-400',
    'bg-amber-50',
    'bg-amber-900/20',
    'border-amber-200',
    'border-amber-800',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        'card-cool': 'var(--color-card-cool)',
        'card-warm': 'var(--color-card-warm)',
        'card-dark': 'var(--color-card-dark)',
        border: 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
      },
      fontFamily: {
        sans: ['var(--font-urbanist)', 'sans-serif'],
        heading: ['var(--font-ubuntu)', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
      },
    },
  },
  plugins: [],
}

export default config
