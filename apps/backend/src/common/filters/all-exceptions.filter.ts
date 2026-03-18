/**
 * Global Exception Filter
 *
 * Catches all exceptions and formats them consistently.
 */

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { appLogger } from '../logging/app-logger.js';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

type McpHttpException = HttpException & {
  wwwAuthenticate?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || message;
        error = (responseObj.error as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    appLogger.error(
      {
        event: 'http.exception',
        method: request.method,
        path: request.url,
        statusCode: status,
        errorName: error,
        errorMessage: message,
        exception: exception instanceof Error ? exception.stack : String(exception),
      },
      'HTTP exception'
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add request ID if present
    const requestId = request.headers['x-request-id'];
    if (typeof requestId === 'string') {
      errorResponse.requestId = requestId;
    }

    // Set WWW-Authenticate header for MCP OAuth errors (RFC 9728)
    const mcpException =
      exception instanceof HttpException ? (exception as McpHttpException) : null;
    if (mcpException?.wwwAuthenticate) {
      response.setHeader('WWW-Authenticate', mcpException.wwwAuthenticate);
      response.setHeader('Access-Control-Expose-Headers', 'WWW-Authenticate');
    }

    response.status(status).json(errorResponse);
  }
}
