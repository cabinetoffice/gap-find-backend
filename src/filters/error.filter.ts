import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(Error)
export class ErrorFilter extends BaseExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const stack = exception.stack;
        const message = exception.message;
        const request = ctx.getRequest<Request>();

        Logger.error({
            message: 'Caught Error',
            path: request.url,
            error: message,
            stack: stack,
        });
        response.status(404).json({
            timestamp: new Date().toISOString(),
            path: request.url,
            errorMessage: message,
        });
    }
}
