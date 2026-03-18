/**
 * Fast structured logger for backend observability.
 */

import pino from 'pino';
import { redactSensitiveFields } from './redact-sensitive-fields.js';
import { requestContext } from './request-context.js';

type LogFields = Record<string, unknown>;

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'authorization',
      'cookie',
      '*.authorization',
      '*.cookie',
      '*.apiKey',
      '*.accessToken',
      '*.refreshToken',
      '*.clientSecret',
      '*.password',
    ],
    censor: '[REDACTED]',
  },
});

function withContext(fields: LogFields = {}): LogFields {
  const requestId = requestContext.getRequestId();

  if (!requestId || fields.requestId) {
    return redactSensitiveFields(fields) as LogFields;
  }

  return redactSensitiveFields({
    ...fields,
    requestId,
  }) as LogFields;
}

export const appLogger = {
  debug(fields: LogFields, message: string) {
    logger.debug(withContext(fields), message);
  },

  info(fields: LogFields, message: string) {
    logger.info(withContext(fields), message);
  },

  warn(fields: LogFields, message: string) {
    logger.warn(withContext(fields), message);
  },

  error(fields: LogFields, message: string) {
    logger.error(withContext(fields), message);
  },
};
