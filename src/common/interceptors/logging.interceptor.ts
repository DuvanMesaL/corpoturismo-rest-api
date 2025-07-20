import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { email?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuthenticatedRequest>();
    const response = httpContext.getResponse<Response>();
    const { method, url, ip, user } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.logger.log(
          `${method} ${url} - ${response.statusCode} - ${duration}ms - User: ${user?.email ?? 'anonymous'} - IP: ${ip}`,
        );
      }),
      catchError((error: Error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.logger.error(
          `${method} ${url} - ERROR - ${duration}ms - ${error.message} - User: ${user?.email ?? 'anonymous'} - IP: ${ip}`,
        );

        return throwError(() => error);
      }),
    );
  }
}
