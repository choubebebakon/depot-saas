import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Création d'un user avec mot de passe hashé automatiquement
  async create(data: { email: string; password: string; role: RoleUser; tenantId: string; nom?: string; depotId?: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        nom: data.nom,
        tenantId: data.tenantId,
        depotId: data.depotId ?? null,
      },
    });
  }

  // Alias pour la création d'employés depuis la page Équipe
  async createEmployee(data: { email: string; password: string; role: RoleUser; tenantId: string; nom?: string; depotId?: string }) {
    return this.create(data);
  }

  async findAll(tenantId: string, depotId?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        ...(depotId ? { depotId } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        tenantId: true,
        depotId: true,
        isActive: true,
        createdAt: true,
        // password exclu
      },
      orderBy: { createdAt: 'desc' },
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

  // Activation ou désactivation d'un utilisateur
  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        isActive: true,
        tenantId: true,
      },
    });
  }

  // Mise à jour partielle (rôle, nom, dépôt)
  async update(id: string, data: { nom?: string; role?: any; depotId?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        depotId: true,
        isActive: true,
        tenantId: true,
      },
    });
  }

  // Suppression d'un utilisateur
  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
