// src/shared/filters/http-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json({
        success: false,
        timestamp: new Date().toISOString(),
        message: exception.message,
      });
    } else {
      console.error('Unexpected error:', exception);
      response.status(500).json({
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Internal server error',
      });
    }
  }
}