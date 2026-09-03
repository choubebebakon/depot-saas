import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { metierSlugMiddleware } from './common/middleware/metier-slug.middleware';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // CORS: les origines de production doivent être explicitement déclarées
  // via FRONTEND_URLS (séparées par des virgules). Les URLs localhost restent
  // disponibles pour le développement local.
  const configuredOrigins = (process.env.FRONTEND_URLS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && configuredOrigins.length === 0) {
    throw new Error(
      'Configuration de production invalide: FRONTEND_URLS doit contenir au moins une origine frontend autorisée.',
    );
  }

  const corsOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:3000',
        'http://localhost:3001',
      ];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-tenant-id',
      'X-Tenant-Id',
      'x-refresh-token',
      'x-depot-id',
      'X-Depot-Id',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Cache-Control',
    ],
    exposedHeaders: ['x-tenant-id', 'x-new-access-token'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Sert le dossier uploads/ statiquement — nécessaire pour que les avatars
  // uploadés soient accessibles via /uploads/avatars/<fichier>
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.use(metierSlugMiddleware);

  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  // Swagger peut rester disponible en développement. En production, il faut
  // l'activer explicitement avec SWAGGER_ENABLED=true.
  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('GeStock SaaS API')
      .setDescription(
        "Documentation de l'API GeStock pour la gestion de stocks multi-tenant",
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.use(
    json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  if (process.env.DISABLE_SUBSCRIPTION_CHECKS === 'true') {
    console.warn('\n' + '⚠️ '.repeat(20));
    console.warn(
      '⚠️  DISABLE_SUBSCRIPTION_CHECKS=true — CONTRÔLES ABONNEMENT DÉSACTIVÉS',
    );
    console.warn(
      '⚠️  Ne JAMAIS déployer en production avec ce flag actif.',
    );
    console.warn('⚠️ '.repeat(20) + '\n');
  }

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT invalide: utiliser un entier entre 1 et 65535.');
  }

  await app.listen(port);
  console.log(`🚀 Backend GeStock SaaS stabilisé sur le port ${port}`);
}
bootstrap();