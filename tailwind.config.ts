import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F1ED',
        surface: '#FFFFFF',
        'text-primary': '#2C2C2C',
        'text-secondary': '#666666',
        'text-muted': '#888888',
        accent: {
          DEFAULT: '#FF6B35',
          hover: '#E65A2A',
        },
        'card-cool': '#E8EEF2',
        'card-warm': '#F9F7F4',
        'card-dark': '#3A3A3A',
        border: '#D4CCC5',
        'border-light': '#E8E4DF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
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
