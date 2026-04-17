/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        'hp-blue': {
          DEFAULT: '#0096d6',
          vibrant: '#00aae1',
          deep: '#006a9d',
        },
        'hp-dark': {
          DEFAULT: '#0a0a0c',
          lighter: '#121216',
          surface: '#18181b',
        },
        'hp-darker': '#050608',
        'glass-bg': 'rgba(15, 18, 25, 0.7)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        slate: {
          850: '#1e293b', // Mapped from original
          950: '#020617',
        },
        'accent-emerald': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-rose': '#f43f5e',
      },
      boxShadow: {
        'premium-sm': '0 2px 8px -2px rgba(0,0,0,0.5)',
        'premium-md': '0 8px 32px -4px rgba(0,0,0,0.6)',
        'premium-glow': '0 0 15px -3px rgba(0,150,214,0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'subtle-pulse': 'subtlePulse 4s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
