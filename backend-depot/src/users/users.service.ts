import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Création d'un user avec mot de passe hashé automatiquement
  async create(data: { email: string; password: string; role: RoleUser; tenantId: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword, // ✅ Toujours hashé
        role: data.role,
        tenantId: data.tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        // password exclu
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}