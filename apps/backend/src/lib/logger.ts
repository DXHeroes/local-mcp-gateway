/**
 * Structured logging with Winston
 */

import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isDevelopment ? winston.format.colorize() : winston.format.json()
  ),
  defaultMeta: {
    service: 'local-mcp-gateway',
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      silent: isTest, // Silent in test environment
    }),
  ],
});

// Add file transport in production
if (!isDevelopment && !isTest) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}
