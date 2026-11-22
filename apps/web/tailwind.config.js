/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#07130e',
          900: '#0c1e17',
          800: '#142e24',
          700: '#1c4234',
          600: '#275845',
          500: '#34725a',
          400: '#4c9276',
          300: '#6eb397',
        },
        ivory: {
          50: '#fdfcf9',
          100: '#f9f6f0',
          200: '#f1ebdF',
          300: '#e5dcce',
          400: '#cbbea9',
          900: '#292520',
        },
        sage: {
          100: '#eef3f0',
          200: '#dce5e0',
          300: '#c2d2cb',
          400: '#a3bbb1',
          500: '#85a497',
          600: '#69877b',
          700: '#526b62',
        },
        charcoal: {
          950: '#0a0b0d',
          900: '#111216',
          850: '#16181d',
          800: '#1c1e24',
          700: '#282b34',
          600: '#383c48',
          500: '#4d5262',
          400: '#6b7280',
          300: '#9ca3af',
        },
        bnb: {
          yellow: '#F3BA2F',
          dark: '#E0A526',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        'glow-forest': '0 0 25px -5px rgba(52, 114, 90, 0.3)',
      },
      borderColor: {
        subtle: 'rgba(255, 255, 255, 0.08)',
        refined: 'rgba(255, 255, 255, 0.14)',
      },
    },
  },
  plugins: [],
};
