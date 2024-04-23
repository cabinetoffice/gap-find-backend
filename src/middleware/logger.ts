import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(request: Request, response: Response, next: NextFunction): void {
        const startAt = process.hrtime.bigint();
        const { ip, method, originalUrl } = request;
        const userAgent = request.get('user-agent') || '';

        this.logger.log({
            message: 'Incoming request',
            method,
            originalUrl,
            userAgent,
            ip,
        });

        response.on('finish', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length');
            const endAt = process.hrtime.bigint();
            const responseTime = `${(endAt - startAt) / BigInt(1000)}ms`;
            this.logger.log({
                message: 'Outgoing response',
                method,
                originalUrl,
                statusCode,
                responseTime,
                contentLength,
                userAgent,
                ip,
            });
        });

        response.on('error', (error) => {
            const { statusCode } = response;
            this.logger.error({
                message: 'Response error',
                method,
                originalUrl,
                statusCode,
                userAgent,
                ip,
                error: error.message,
            });
        });
        next();
    }
}
