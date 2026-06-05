import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CuisineService {
  constructor(private prisma: PrismaService) {}
  // Logic for cuisine state management
}
