


/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        code: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Brand
        primary: '#12A594',
        'primary-dark': '#0E8C7E',
        'primary-light': '#2DD4BF',
        secondary: '#CCFBF1',
        accent: '#F97316',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',

        // Surfaces — LIGHT app workspace
        background: '#F6F8FB',        // base page bg
        surface: '#FFFFFF',           // card bg
        'surface-2': '#F1F5F9',       // raised / floating chips
        border: '#E6EBF1',            // divider / card border

        // Text
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',

        // States
        hover: 'rgba(18, 165, 148, 0.08)',

        // Sidebar — deep navy
        'sidebar-bg': '#0E1B36',
        'sidebar-hover': 'rgba(45, 212, 191, 0.14)',
        'dark-text': '#F8FAFC',
        'dark-text-secondary': '#C3CCDA',
        'dark-border': 'rgba(255, 255, 255, 0.08)',
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'secondary': ['12px', { fontWeight: '400' }],
        'micro': ['11px', { letterSpacing: '0.08em', fontWeight: '500' }],
        'overline': ['12px', { letterSpacing: '0.06em', fontWeight: '600' }],
        'kpi': ['28px', { letterSpacing: '-0.02em', fontWeight: '800' }],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 4px 16px -4px rgba(15, 23, 42, 0.06)',
        'glow': '0 4px 14px -4px rgba(18, 165, 148, 0.45)',
      }
    },
  },
  plugins: [],
}


