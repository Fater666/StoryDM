import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
}

// 日志等级对应的颜色和图标
const levelStyles: Record<string, { color: string; icon: string }> = {
  debug: { color: colors.gray, icon: '🔍' },
  info: { color: colors.blue, icon: 'ℹ️ ' },
  warn: { color: colors.yellow, icon: '⚠️ ' },
  error: { color: colors.red, icon: '❌' },
}

// 终端日志插件
function terminalLoggerPlugin(): Plugin {
  return {
    name: 'terminal-logger',
    configureServer(server) {
      server.ws.on('app:log', (data: {
        level: string;
        category: string;
        message: string;
        data?: any;
        timestamp: string;
      }) => {
        const style = levelStyles[data.level] || levelStyles.info
        const time = new Date(data.timestamp).toLocaleTimeString('zh-CN')
        
        // 格式化日志输出
        const prefix = `${style.icon} ${colors.gray}[${time}]${colors.reset} ${colors.cyan}[${data.category}]${colors.reset}`
        const msg = `${style.color}${data.message}${colors.reset}`
        
        console.log(`${prefix} ${msg}`)
        
        // 如果有附加数据，打印出来
        if (data.data !== undefined) {
          const dataStr = typeof data.data === 'string' 
            ? data.data 
            : JSON.stringify(data.data, null, 2)
          // 缩进数据输出
          const indentedData = dataStr.split('\n').map(line => `    ${colors.gray}${line}${colors.reset}`).join('\n')
          console.log(indentedData)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), terminalLoggerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

