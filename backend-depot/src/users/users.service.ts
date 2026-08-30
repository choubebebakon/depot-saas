import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RoleUser, AuditSeverite } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';
import { AuditActor } from '../audit/audit-actor.util';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Création d'un user avec mot de passe hashé automatiquement
  async create(
    data: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId: string;
      nom?: string;
      depotId?: string;
    },
    actor?: AuditActor,
  ) {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        nom: data.nom,
        tenantId: data.tenantId,
        depotId: data.depotId ?? null,
      },
    });

    if (actor && data.tenantId) {
      await this.auditService
        .logEvent({
          tenantId: data.tenantId,
          depotId: data.depotId ?? actor.depotId ?? null,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.UTILISATEUR_CREE,
          severite: AuditSeverite.ATTENTION,
          targetType: 'User',
          targetId: user.id,
          reference: user.email,
          description: `Utilisateur ${user.email} créé (rôle ${user.role})`,
          valeurApres: { email: user.email, role: user.role, depotId: user.depotId },
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log UTILISATEUR_CREE:', err));
    }

    return user;
  }

  // Alias pour la création d'employés depuis la page Équipe
  async createEmployee(
    data: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId: string;
      nom?: string;
      depotId?: string;
    },
    actor?: AuditActor,
  ) {
    return this.create(data, actor);
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
  async updateStatus(
    id: string,
    isActive: boolean,
    tenantId: string,
    actor?: AuditActor,
  ) {
    // SÉCURITÉ : `where: { id }` seul (sans tenantId) permettait à un
    // GERANT de désactiver un utilisateur de N'IMPORTE QUEL AUTRE TENANT
    // en devinant/énumérant un UUID — même faille que celle corrigée sur
    // create(), jamais traitée ici.
    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { isActive: true, email: true },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { isActive },
    });
    if (result.count === 0) throw new NotFoundException('Utilisateur introuvable');

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        isActive: true,
        tenantId: true,
        depotId: true,
      },
    });

    if (actor) {
      await this.auditService
        .logEvent({
          tenantId,
          depotId: user?.depotId ?? actor.depotId ?? null,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.UTILISATEUR_DESACTIVE,
          severite: AuditSeverite.ATTENTION,
          targetType: 'User',
          targetId: id,
          reference: avant.email,
          description: `Statut de ${avant.email} : ${avant.isActive} → ${isActive}`,
          valeurAvant: { isActive: avant.isActive },
          valeurApres: { isActive },
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log UTILISATEUR_DESACTIVE:', err));
    }

    return user;
  }

  // Mise à jour partielle (rôle, nom, dépôt)
  async update(
    id: string,
    data: { nom?: string; role?: any; depotId?: string },
    tenantId: string,
    actor?: AuditActor,
  ) {
    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { nom: true, role: true, depotId: true, email: true },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data,
    });
    if (result.count === 0) throw new NotFoundException('Utilisateur introuvable');

    const user = await this.prisma.user.findUnique({
      where: { id },
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

    if (actor) {
      await this.auditService
        .logEvent({
          tenantId,
          depotId: user?.depotId ?? actor.depotId ?? null,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.UTILISATEUR_MODIFIE,
          severite: AuditSeverite.INFO,
          targetType: 'User',
          targetId: id,
          reference: avant.email,
          description: `Utilisateur ${avant.email} modifié`,
          valeurAvant: avant,
          valeurApres: data,
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log UTILISATEUR_MODIFIE:', err));
    }

    return user;
  }

  // Suppression d'un utilisateur
  async remove(id: string, tenantId: string, actor?: AuditActor) {
    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, email: true, role: true, nom: true, depotId: true },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    const user = await this.prisma.user.delete({ where: { id } });

    if (actor) {
      await this.auditService
        .logEvent({
          tenantId,
          depotId: avant.depotId ?? actor.depotId ?? null,
          actorUserId: actor.userId,
          actorEmail: actor.email,
          actorRole: actor.role,
          action: AUDIT_ACTIONS.SUPPRESSION_UTILISATEUR,
          severite: AuditSeverite.CRITIQUE,
          targetType: 'User',
          targetId: id,
          reference: avant.email,
          description: `Suppression de l'utilisateur ${avant.email} (rôle ${avant.role})`,
          valeurAvant: avant,
          ipAddress: actor.ip,
          userAgent: actor.userAgent,
        })
        .catch((err) => console.error('[Audit] Échec log SUPPRESSION_UTILISATEUR:', err));
    }

    return user;
  }
}