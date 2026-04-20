import type { Config } from 'tailwindcss';

// Palette inspired by Capgemini's 2022 brand refresh:
//   - Vibrant Blue (#12abdb) as the primary action color
//   - Deep Navy (#0a192f / #001f36) for surfaces with strong contrast
//   - Coral accent for CTAs and "new" highlights
//   - Lime accent for success / energy moments
// The `brand` scale stays named `brand` so existing components inherit
// the new look without sweeping class renames.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — Capgemini Vibrant Blue family
        brand: {
          50: '#e7f7fc',
          100: '#c2eaf6',
          200: '#92daef',
          300: '#55c4e5',
          400: '#1cb3df',
          500: '#12abdb', // Capgemini vibrant blue — the headline action color
          600: '#0d8bb5',
          700: '#0a6d8f',
          800: '#0b506b',
          900: '#001f36', // Capgemini deep navy
        },
        // Deep surface — bold navy for hero / landing panels
        ink: {
          900: '#0a192f',
          950: '#050d1c',
        },
        // Coral accent for primary CTAs and "new" callouts
        accent: {
          50: '#fff1f3',
          100: '#ffdfe3',
          400: '#ff8fa4',
          500: '#ff4f78',
          600: '#e8355e',
          700: '#c42048',
        },
        // Lime accent for success / energy flourishes
        energy: {
          100: '#effbc8',
          400: '#c5e86c',
          500: '#a7d045',
          600: '#84aa2c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(1200px 600px at 80% 0%, rgba(18,171,219,0.28) 0%, transparent 60%), radial-gradient(900px 500px at 10% 80%, rgba(255,79,120,0.22) 0%, transparent 55%)',
      },
      animation: {
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
