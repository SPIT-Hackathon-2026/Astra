import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FEF3EE',
          100: '#FDE4D5',
          200: '#FAC5A9',
          300: '#F5A077',
          400: '#E87B55',
          500: '#C75B39',
          600: '#A04328',
          700: '#84351F',
          800: '#6B2B19',
          900: '#4A1E12',
          950: '#2D110A',
        },
        secondary: {
          50: '#F0FDF9',
          100: '#D1FAF0',
          200: '#A7F3E2',
          300: '#6DE7CB',
          400: '#40C9B0',
          500: '#2BA998',
          600: '#1F887C',
          700: '#1C6D65',
          800: '#1B5752',
          900: '#1A4844',
          950: '#0A2D2B',
        },
      },
      fontFamily: {
        sans: ['Fredoka', 'var(--font-fredoka)', 'Arial', 'sans-serif'],
        display: ['Luckiest Guy', 'var(--font-luckiest-guy)', 'cursive'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;