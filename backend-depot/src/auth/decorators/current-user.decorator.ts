import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Injecte req.user directement dans les paramètres d'un controller
// Exemple d'usage : getStats(@CurrentUser() user: any)
export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);