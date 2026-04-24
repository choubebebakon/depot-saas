import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Création d'un user avec mot de passe hashé automatiquement
  async create(data: { email: string; password: string; role: RoleUser; tenantId: string; nom?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        nom: data.nom,       // Nom affiché (ex: "Jean Dupont")
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
        nom: true,
        tenantId: true,
        createdAt: true,
        // password exclu
      },
    });
  }

  async findCommerciaux(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, role: RoleUser.COMMERCIAL },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
