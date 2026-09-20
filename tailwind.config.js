/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563EB',
        'accent-emerald': '#059669',
        'bg-light-primary': '#FAFAFA',
        'bg-light-secondary': '#FFFFFF',
        'text-light-primary': '#1F2937',
        'text-light-secondary': '#6B7280',
        'danger-red': '#DC2626',
        'success-green': '#10B981',

        'bg-dark-primary': '#0F172A',
        'bg-dark-secondary': '#1E293B',
        'text-dark-primary': '#F1F5F9',
        'text-dark-secondary': '#94A3B8',
        'primary-interactive-dark': '#3B82F6',
        'accent-emerald-dark': '#34D399',
        'danger-red-dark': '#EF4444',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px rgba(0,0,0,0.1)',
        'lg': '0 10px 30px rgba(0,0,0,0.15)',
        'dark-sm': '0 1px 2px rgba(0,0,0,0.3)',
        'dark-md': '0 4px 6px rgba(0,0,0,0.4)',
        'dark-lg': '0 10px 30px rgba(0,0,0,0.5)',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="dark"]'],
}