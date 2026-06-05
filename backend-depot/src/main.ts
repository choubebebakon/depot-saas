import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // bufferLogs: true permet à nestjs-pino de récupérer les logs initiaux proprement
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.use(cookieParser());
  
  // Préfixe global pour l'API standard
  app.setGlobalPrefix('api/v1');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('GeStock SaaS API')
    .setDescription('Documentation de l\'API GeStock pour la gestion de stocks multi-tenant')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Sécurisation stricte de l'encodage et de la taille des données (UTF-8 par défaut)
  app.use(json({
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // CORS : Autorise votre frontend Vite/React (Port 5173) à communiquer de manière sécurisée
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Depot-Id'],
  });

  // SUPPRESSION DU MIDDLEWARE EXPRESS BRUT ICI !
  // C'est maintenant le ContextMiddleware (dans app.module) qui gère l'AsyncLocalStorage de manière stable.

  // Validation globale des DTOs (Transforme et nettoie les entrées contre les injections)
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true, 
  }));

  await app.listen(3000);
  console.log(`🚀 Backend GeStock SaaS stabilisé sur http://localhost:3000`);
}
bootstrap();