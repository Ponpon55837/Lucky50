/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 傳統色彩主題
        gold: {
          50: '#fefdf8',
          100: '#fef7cd',
          400: '#facc15',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        jade: {
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        chinese: ['Noto Sans TC', 'Microsoft YaHei', 'PingFang TC', 'sans-serif'],
      },
      animation: {
        'fortune-glow': 'fortune-glow 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'fortune-glow': {
          '0%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(245, 158, 11, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
