import { BadRequestException, CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Inline consignment returns used to mutate a client portfolio without a
 * depot-aware portfolio lookup. Until that workflow is depot-safe, reject it
 * from the POS sale endpoint and keep consignment operations on their
 * dedicated, scoped endpoints.
 */
@Injectable()
export class VenteConsigneSafetyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method?: string; body?: { retoursConsigne?: unknown } }>();
    if (request.method === 'POST' && Array.isArray(request.body?.retoursConsigne) && request.body.retoursConsigne.length > 0) {
      throw new BadRequestException(
        'Les retours de consignes doivent être enregistrés via le workflow dédié de consignes du dépôt.',
      );
    }
    return next.handle();
  }
}
