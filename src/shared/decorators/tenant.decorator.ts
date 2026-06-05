import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Assurez-vous que tenantId est défini par l'interceptor ou le middleware
    return request.tenantId;
  },
);
