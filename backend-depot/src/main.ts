import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log('Backend URL:', process.env.BACKEND_URL);

  // CORS : autorise le frontend React à appeler le backend
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Validation globale des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend NestJS démarré sur http://localhost:3000`);
}
bootstrap();
