/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class', // 啟用 class 模式的深色主題
  theme: {
    extend: {
      colors: {
        // 主要配色系統
        primary: {
          50: '#eff6ff', // 淺色模式背景
          100: '#dbeafe', // 淺色輔助
          500: '#3b82f6', // 主要藍色
          600: '#2563eb', // 深一點的藍
          700: '#1d4ed8', // 更深的藍
          800: '#1e3a8a', // 深藍色背景
          900: '#1e293b', // 最深的藍
        },
        // 輔助色彩
        accent: {
          gold: '#f59e0b',
          'gold-light': '#fbbf24',
          'gold-dark': '#d97706',
        },
        // 狀態色彩
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      backgroundColor: {
        // 動態背景色
        'app-bg': 'var(--app-bg)',
        'card-bg': 'var(--card-bg)',
        'surface-bg': 'var(--surface-bg)',
      },
      textColor: {
        // 動態文字色
        'primary-text': 'var(--primary-text)',
        'secondary-text': 'var(--secondary-text)',
        'accent-text': 'var(--accent-text)',
      },
      borderColor: {
        // 動態邊框色
        'border-light': 'var(--border-light)',
        'border-medium': 'var(--border-medium)',
      },
      fontFamily: {
        chinese: ['Noto Sans TC', 'Microsoft YaHei', 'PingFang TC', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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
