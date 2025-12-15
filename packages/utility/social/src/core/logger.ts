import { config } from './config.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

interface LogContext {
  platform?: string;
  tool?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private minLevel: number;
  private useColors: boolean;

  constructor() {
    this.minLevel = LOG_LEVELS[config.server.logLevel];
    this.useColors = process.stderr.isTTY ?? false;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLevel(level: LogLevel): string {
    const levelStr = level.toUpperCase().padEnd(5);
    if (!this.useColors) return levelStr;

    switch (level) {
      case 'debug':
        return `${COLORS.dim}${levelStr}${COLORS.reset}`;
      case 'info':
        return `${COLORS.green}${levelStr}${COLORS.reset}`;
      case 'warn':
        return `${COLORS.yellow}${levelStr}${COLORS.reset}`;
      case 'error':
        return `${COLORS.red}${levelStr}${COLORS.reset}`;
      default:
        return levelStr;
    }
  }

  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';

    const parts: string[] = [];
    if (context.platform) {
      parts.push(this.useColors ? `${COLORS.cyan}[${context.platform}]${COLORS.reset}` : `[${context.platform}]`);
    }
    if (context.tool) {
      parts.push(this.useColors ? `${COLORS.magenta}[${context.tool}]${COLORS.reset}` : `[${context.tool}]`);
    }
    if (context.requestId) {
      parts.push(this.useColors ? `${COLORS.dim}(${context.requestId})${COLORS.reset}` : `(${context.requestId})`);
    }

    // Add any additional context
    const additionalKeys = Object.keys(context).filter(
      (k) => !['platform', 'tool', 'requestId'].includes(k)
    );
    if (additionalKeys.length > 0) {
      const additional = additionalKeys.map((k) => `${k}=${JSON.stringify(context[k])}`).join(' ');
      parts.push(this.useColors ? `${COLORS.dim}${additional}${COLORS.reset}` : additional);
    }

    return parts.length > 0 ? ` ${parts.join(' ')}` : '';
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const timestamp = this.formatTimestamp();
    const levelStr = this.formatLevel(level);
    const contextStr = this.formatContext(context);

    // Always log to stderr to not interfere with MCP stdio transport
    console.error(`${timestamp} ${levelStr}${contextStr} ${message}`);

    if (error) {
      console.error(`${timestamp} ${levelStr}${contextStr} Stack: ${error.stack}`);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // Create a child logger with preset context
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  private mergeContext(additionalContext?: LogContext): LogContext {
    return { ...this.context, ...additionalContext };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }
}

export const logger = new Logger();
export type { LogContext, ChildLogger };
