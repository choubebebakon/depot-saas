import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from '../prisma.service'; // Assure-toi que le chemin est correct

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService], // On ajoute PrismaService ici !
})
export class ArticlesModule { }