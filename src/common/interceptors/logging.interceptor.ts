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

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, user, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log básico sin dependencia circular
        this.logger.log(
          `${method} ${url} - ${response.statusCode} - ${duration}ms - User: ${user?.email || 'anonymous'} - IP: ${ip}`,
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.logger.error(
          `${method} ${url} - ERROR - ${duration}ms - ${error.message} - User: ${user?.email || 'anonymous'} - IP: ${ip}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
