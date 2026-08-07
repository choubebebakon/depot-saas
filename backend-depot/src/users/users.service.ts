import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';

interface ActorContext {
  userId?: string;
  email?: string;
  role?: string;
  tenantId?: string;
  depotId?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Création d'un user avec mot de passe hashé automatiquement
  async create(data: {
    email: string;
    password: string;
    role: RoleUser;
    tenantId: string;
    nom?: string;
    depotId?: string;
  }) {
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
  async createEmployee(data: {
    email: string;
    password: string;
    role: RoleUser;
    tenantId: string;
    nom?: string;
    depotId?: string;
  }) {
    return this.create(data);
  }

  async findAll(tenantId: string, depotId?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId: tenantId,
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

  // GET /:id — Détail d'un employé (Phase 4)
  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        tenantId: true,
        depotId: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Activation ou désactivation d'un utilisateur
  async updateStatus(id: string, isActive: boolean, actor?: ActorContext) {
    const avant = await this.prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    const user = await this.prisma.user.update({
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

    if (actor?.tenantId) {
      await this.auditService.logEvent({
        tenantId: actor.tenantId,
        depotId: actor.depotId ?? null,
        actorUserId: actor.userId ?? null,
        actorEmail: actor.email ?? null,
        actorRole: actor.role ?? null,
        action: AUDIT_ACTIONS.UTILISATEUR_DESACTIVE,
        targetType: 'User',
        targetId: user.id,
        description: `Statut de ${user.email} : ${avant?.isActive} → ${user.isActive}`,
        valeurAvant: avant,
        valeurApres: { isActive: user.isActive },
      });
    }

    return user;
  }

  // Mise à jour partielle (rôle, nom, dépôt)
  async update(
    id: string,
    data: { nom?: string; role?: any; depotId?: string },
    actor?: ActorContext,
  ) {
    const avant = await this.prisma.user.findUnique({
      where: { id },
      select: { nom: true, role: true, depotId: true },
    });

    const user = await this.prisma.user.update({
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

    if (actor?.tenantId) {
      await this.auditService.logEvent({
        tenantId: actor.tenantId,
        depotId: actor.depotId ?? null,
        actorUserId: actor.userId ?? null,
        actorEmail: actor.email ?? null,
        actorRole: actor.role ?? null,
        action: AUDIT_ACTIONS.UTILISATEUR_MODIFIE,
        targetType: 'User',
        targetId: user.id,
        description: `Utilisateur ${user.email} modifié`,
        valeurAvant: avant,
        valeurApres: data,
      });
    }

    return user;
  }

  // Suppression d'un utilisateur
  async remove(id: string, actor?: ActorContext) {
    const avant = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, nom: true, tenantId: true },
    });

    const user = await this.prisma.user.delete({ where: { id } });

    if (actor?.tenantId && avant) {
      await this.auditService.logEvent({
        tenantId: actor.tenantId,
        depotId: actor.depotId ?? null,
        actorUserId: actor.userId ?? null,
        actorEmail: actor.email ?? null,
        actorRole: actor.role ?? null,
        action: AUDIT_ACTIONS.SUPPRESSION_UTILISATEUR,
        severite: 'ATTENTION',
        targetType: 'User',
        targetId: id,
        description: `Suppression de l'utilisateur ${avant.email}`,
        valeurAvant: avant,
      });
    }

    return user;
  }
}
