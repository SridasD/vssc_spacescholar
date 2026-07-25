type LogLevel = 'info' | 'warn' | 'error';

const getTimestamp = () => new Date().toISOString();

const formatMessage = (level: LogLevel, message: string, ...args: any[]) => {
  const timestamp = getTimestamp();
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
};

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(formatMessage('info', message, ...args));
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(formatMessage('warn', message, ...args));
  },
  error: (message: string, ...args: any[]) => {
    console.error(formatMessage('error', message, ...args));
  }
};