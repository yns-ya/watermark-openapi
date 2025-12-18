import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          code: this.getErrorCode(status),
          message:
            (exceptionResponse as any).message || exception.message,
          details: (exceptionResponse as any).error,
        };
      } else {
        errorResponse = {
          code: this.getErrorCode(status),
          message: exceptionResponse as string,
        };
      }
    } else if (exception instanceof Error) {
      errorResponse = {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development'
          ? exception.message
          : 'An unexpected error occurred',
      };
    }

    // Don't expose sensitive info in production
    if (process.env.NODE_ENV !== 'development') {
      delete errorResponse.details;
    }

    // Add metadata
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.path = request.url;

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      413: 'PAYLOAD_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      501: 'NOT_IMPLEMENTED',
      503: 'SERVICE_UNAVAILABLE',
    };

    return codes[status] || 'UNKNOWN_ERROR';
  }
}
