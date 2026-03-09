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
        primary: {
          50:  '#fdf8f3',
          100: '#f5e9d9',
          200: '#e8cba8',
          300: '#d4a574',
          400: '#be7d40',
          500: '#9e5c1e',
          600: '#7a4216',
          700: '#5c3010',
          800: '#3d1f08',
          900: '#2a1505',
          DEFAULT: '#7a4216',
        },
        dark: '#3d1f08',   // Header koyu kahve
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
