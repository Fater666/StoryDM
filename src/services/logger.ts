// 日志等级
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志条目
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

// 日志服务类
class LoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 最多保留1000条日志
  private logLevel: LogLevel = 'debug';
  
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  
  private levelColors: Record<LogLevel, string> = {
    debug: '#6b7280',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
  };
  
  private levelIcons: Record<LogLevel, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };
  
  // 设置日志等级
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
  
  // 发送日志到 Vite 开发服务器终端
  private sendToTerminal(level: LogLevel, category: string, message: string, timestamp: Date, data?: any) {
    // 只在开发环境下发送
    if (import.meta.hot) {
      import.meta.hot.send('app:log', {
        level,
        category,
        message,
        timestamp: timestamp.toISOString(),
        data,
      });
    }
  }
  
  // 添加日志
  private log(level: LogLevel, category: string, message: string, data?: any) {
    if (this.levelPriority[level] < this.levelPriority[this.logLevel]) {
      return;
    }
    
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };
    
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // 控制台输出
    const icon = this.levelIcons[level];
    const color = this.levelColors[level];
    const timestamp = entry.timestamp.toLocaleTimeString('zh-CN');
    
    const consoleMethod = level === 'error' ? console.error 
      : level === 'warn' ? console.warn 
      : level === 'info' ? console.info 
      : console.debug;
    
    consoleMethod(
      `%c${icon} [${timestamp}] [${category}] ${message}`,
      `color: ${color}; font-weight: bold;`,
      data !== undefined ? data : ''
    );
    
    // 发送到 Vite 开发服务器终端
    this.sendToTerminal(level, category, message, entry.timestamp, data);
    
    return entry;
  }
  
  // 快捷方法
  debug(category: string, message: string, data?: any) {
    return this.log('debug', category, message, data);
  }
  
  info(category: string, message: string, data?: any) {
    return this.log('info', category, message, data);
  }
  
  warn(category: string, message: string, data?: any) {
    return this.log('warn', category, message, data);
  }
  
  error(category: string, message: string, data?: any) {
    return this.log('error', category, message, data);
  }
  
  // 获取所有日志
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  // 按类别获取日志
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
  
  // 按等级获取日志
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  // 清空日志
  clear() {
    this.logs = [];
  }
  
  // 导出日志为文本
  exportAsText(): string {
    return this.logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      return `[${timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${dataStr}`;
    }).join('\n\n');
  }
  
  // 导出日志为 JSON
  exportAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 单例导出
export const logger = new LoggerService();

// 预定义的日志类别
export const LogCategories = {
  AI: 'AI',
  DB: 'Database',
  WORLD: 'World',
  CHARACTER: 'Character',
  SESSION: 'Session',
  ARCHIVE: 'Archive',
  APP: 'App',
} as const;
