/**
 * Logging Utilities
 * Simple logger that outputs to stderr (MCP servers use stderr for logs, stdout for protocol)
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;

  if (args.length > 0) {
    console.error(formattedMessage, ...args);
  } else {
    console.error(formattedMessage);
  }
}

export function logDebug(message: string, ...args: unknown[]): void {
  log(LogLevel.DEBUG, message, ...args);
}

export function logInfo(message: string, ...args: unknown[]): void {
  log(LogLevel.INFO, message, ...args);
}

export function logWarning(message: string, ...args: unknown[]): void {
  log(LogLevel.WARNING, message, ...args);
}

export function logError(message: string, ...args: unknown[]): void {
  log(LogLevel.ERROR, message, ...args);
}

// Export logger object for convenience
export const logger = {
  debug: logDebug,
  info: logInfo,
  warning: logWarning,
  error: logError,
};
