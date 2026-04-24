import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { DepotScopeService } from './common/depot-scope.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const depotScope = app.get(DepotScopeService);
  
  // Augmenter la limite pour les logos en Base64 (50 Mo comme demandé)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  console.log('Backend URL:', process.env.BACKEND_URL);

  // CORS : autorise le frontend React à appeler le backend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.use((req: any, _res: any, next: () => void) => {
    const rawDepotId =
      req.headers['x-depot-id']
      ?? req.query?.depotId
      ?? req.body?.depotId
      ?? null;

    const depotId = typeof rawDepotId === 'string' && rawDepotId.trim() && rawDepotId !== 'all'
      ? rawDepotId
      : null;

    depotScope.run({ depotId }, next);
  });

  // Validation globale des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(3000);
  console.log(`🚀 Backend NestJS démarré sur http://localhost:3000`);
}
bootstrap();
