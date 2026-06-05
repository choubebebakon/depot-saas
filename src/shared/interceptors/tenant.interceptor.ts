import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    // Ceci est un exemple simple. En production, le tenantId doit être extrait de manière sécurisée (e.g., JWT, en-tête, clé API).
    // Pour l'exemple, nous allons le récupérer d'un en-tête X-Tenant-Id.
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      // En production, vous pourriez vouloir lancer une exception HttpException(Forbidden, 'Tenant ID missing')
      console.warn('Tenant ID missing from request headers.');
    }

    request.tenantId = tenantId; // Attache le tenantId à l'objet request pour un accès facile dans les services/controllers
    return next.handle();
  }
}
