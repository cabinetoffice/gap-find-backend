import {
    Catch,
    ArgumentsHost,
    Logger,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch(Error)
export class ErrorFilter extends BaseExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const stack = exception.stack;
        const message = exception.message;
        const request = ctx.getRequest<Request>();
        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        Logger.error({
            message: 'Caught Error',
            path: request.url,
            error: message,
            status: httpStatus,
            stack: stack,
        });

        response.status(httpStatus).json({
            timestamp: new Date().toISOString(),
            path: request.url,
            errorMessage: message,
        });
    }
}
