import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsHandler');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : exception;

    const body = request.body as Record<string, unknown>;
    const headers = request.headers as Record<string, unknown>;
    const query = request.query as Record<string, unknown>;
    const params = request.params as Record<string, unknown>;

    const safeBody = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'accessToken',
    ];

    sensitiveFields.forEach((field) => {
      if (safeBody[field]) {
        safeBody[field] = '********';
      }
    });

    const safeHeaders = { ...headers };
    if (safeHeaders['authorization']) {
      safeHeaders['authorization'] = 'Bearer ********';
    }
    if (safeHeaders['cookie']) {
      safeHeaders['cookie'] = 'Cookies ********';
    }

    const errorLog = {
      method: request.method,
      url: request.url,
      status,
      params,
      query,
      body: safeBody,
      headers: safeHeaders,
      timestamp: new Date().toISOString(),
      exception: exception instanceof Error ? exception.message : exception,
      stack: exception instanceof Error ? exception.stack : null,
    };

    this.logger.error(`Error at ${request.method} ${request.url}`);
    console.dir(errorLog, { depth: null });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
