import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { tenantId?: string; userId?: string };
  tenantId?: string;
  userId?: string;
}

interface ResponseWithStatus {
  statusCode?: number;
}

/**
 * Module de logging avec Pino.
 * Format JSON structuré pour chaque étape du flux de paiement.
 *
 * Format:
 * { timestamp, level, tenantId, transactionId, method, action, message }
 *
 * Niveaux: ERROR | WARN | INFO | DEBUG
 * Production: WARN+, Development: DEBUG+
 */
@Global()
@Module({
  imports: [
    PinoModule.forRootAsync({
      providers: [],
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'warn' : 'debug',
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    messageFormat: '{tenantId} {transactionId} {method} - {msg}',
                  },
                },
            customProps: (req: any) => {
              // Extraire les propriétés contextuelles si disponibles
              const user = req.user;
              return {
                tenantId: user?.tenantId,
                userId: user?.userId,
              };
            },
            serializers: {
              req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                tenantId: req.tenantId,
                userId: req.userId,
              }),
              res: (res: ResponseWithStatus) => ({
                statusCode: res.statusCode,
              }),
            },
          },
        };
      },
    }),
  ],
  exports: [PinoModule],
})
export class AppLoggerModule {}
