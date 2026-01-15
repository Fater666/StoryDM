/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深邃的龙与地下城主题
        forge: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a24',
          border: '#2a2a3a',
          hover: '#252532',
        },
        arcane: {
          primary: '#8b5cf6',    // 魔法紫
          secondary: '#6366f1',  // 深紫
          glow: '#a78bfa',       // 发光紫
          muted: '#4c1d95',      // 暗紫
        },
        gold: {
          primary: '#f59e0b',    // 金色
          light: '#fbbf24',      // 浅金
          dark: '#b45309',       // 深金
        },
        blood: {
          primary: '#dc2626',    // 血红
          dark: '#991b1b',       // 暗红
        },
        parchment: {
          light: '#fef3c7',      // 羊皮纸浅
          DEFAULT: '#fde68a',    // 羊皮纸
          dark: '#d97706',       // 羊皮纸暗
        }
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'forge-gradient': 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 50%, #0a0a0f 100%)',
        'arcane-glow': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        'gold-shimmer': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)',
      },
      boxShadow: {
        'arcane': '0 0 20px rgba(139, 92, 246, 0.3)',
        'arcane-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
        'gold': '0 0 20px rgba(245, 158, 11, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'dice-roll': 'diceRoll 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

