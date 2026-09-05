import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, AuditResultat, AuditSeverite } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions.constants';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  nom: true,
  telephone: true,
  adresse: true,
  avatar: true,
  twoFAEnabled: true,
  tenantId: true,
  depotId: true,
  isSuperAdmin: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  tenant: { select: { id: true, name: true, metier: true, status: true } },
  depot: { select: { id: true, nom: true } },
  _count: { select: { ventesCreees: true, tourneesOuvertes: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUserSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private assertDifferentActor(actorUserId: string, targetUserId: string) {
    if (!actorUserId || actorUserId === targetUserId) {
      throw new BadRequestException('Un SuperAdmin ne peut pas modifier son propre compte depuis cet espace.');
    }
  }

  private normalizeReason(reason: string | undefined): string {
    const value = typeof reason === 'string' ? reason.trim() : '';
    if (value.length < 5) throw new BadRequestException('Un motif de sécurité d’au moins 5 caractères est obligatoire.');
    if (value.length > 500) throw new BadRequestException('Le motif de sécurité est trop long.');
    return value;
  }

  private async revokeSessions(tx: Prisma.TransactionClient, userId: string) {
    await tx.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
    await tx.refreshToken.deleteMany({ where: { userId } });
  }

  private async auditInTransaction(
    tx: Prisma.TransactionClient,
    actor: any,
    target: any,
    action: string,
    description: string,
    reason: string,
    before: unknown,
    after: unknown,
  ) {
    return this.auditService.logEventInTransaction(tx, {
      tenantId: target.tenantId,
      depotId: target.depotId ?? null,
      actorUserId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      severite: AuditSeverite.ATTENTION,
      resultat: AuditResultat.SUCCES,
      targetType: 'User',
      targetId: target.id,
      reference: target.email,
      description,
      motif: reason,
      valeurAvant: before,
      valeurApres: after,
    });
  }

  private async getActor(actorUserId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, email: true, role: true, isActive: true, isSuperAdmin: true },
    });
    if (!actor?.isActive || !actor.isSuperAdmin) {
      throw new BadRequestException('Session SuperAdmin invalide ou expirée.');
    }
    return actor;
  }

  async toggleUserActive(actorUserId: string, targetUserId: string, reason: string) {
    this.assertDifferentActor(actorUserId, targetUserId);
    const safeReason = this.normalizeReason(reason);
    const actor = await this.getActor(actorUserId);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, email: true, role: true, tenantId: true, depotId: true, isActive: true, isSuperAdmin: true },
        });
        if (!target) throw new NotFoundException('Utilisateur introuvable.');

        if (target.isActive && target.isSuperAdmin) {
          const activeSuperAdmins = await tx.user.count({ where: { isSuperAdmin: true, isActive: true } });
          if (activeSuperAdmins <= 1) throw new ConflictException('Impossible de désactiver le dernier SuperAdmin actif.');
        }

        const updated = await tx.user.update({
          where: { id: target.id },
          data: { isActive: !target.isActive },
          select: ADMIN_USER_SELECT,
        });

        if (target.isActive && !updated.isActive) await this.revokeSessions(tx, target.id);
        const audit = await this.auditInTransaction(
          tx,
          actor,
          resultTarget(target, updated),
          updated.isActive ? AUDIT_ACTIONS.USER_ACTIVATED : AUDIT_ACTIONS.USER_DEACTIVATED,
          `${updated.isActive ? 'Activation' : 'Désactivation'} du compte ${target.email}`,
          safeReason,
          { isActive: target.isActive },
          { isActive: updated.isActive },
        );
        return { target, updated, audit };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      this.auditService.emitAuditUpdate(result.target.tenantId, result.audit);
      return { success: true, user: result.updated, message: `Utilisateur ${result.updated.isActive ? 'activé' : 'désactivé'}` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new ConflictException('Modification concurrente détectée. Veuillez réessayer.');
      }
      throw error;
    }
  }

  async updateUserRole(actorUserId: string, targetUserId: string, role: Role, reason: string) {
    this.assertDifferentActor(actorUserId, targetUserId);
    const safeReason = this.normalizeReason(reason);
    const actor = await this.getActor(actorUserId);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, role: true, tenantId: true, depotId: true, isActive: true, isSuperAdmin: true } });
        if (!target) throw new NotFoundException('Utilisateur introuvable.');
        if (target.role === role) throw new BadRequestException('Cet utilisateur possède déjà ce rôle.');
        if (target.isSuperAdmin && role !== Role.PATRON) throw new BadRequestException('Un SuperAdmin doit rester avec le rôle PATRON.');
        if (target.role === Role.PATRON && target.isSuperAdmin && role !== Role.PATRON) throw new BadRequestException('Retirez d’abord le statut SuperAdmin avant de changer ce rôle.');
        const updated = await tx.user.update({ where: { id: target.id }, data: { role }, select: ADMIN_USER_SELECT });
        await this.revokeSessions(tx, target.id);
        const audit = await this.auditInTransaction(tx, actor, target, AUDIT_ACTIONS.USER_ROLE_CHANGED,
          `Changement de rôle de ${target.email}: ${target.role} → ${updated.role}`,
          safeReason, { role: target.role }, { role: updated.role });
        return { target, updated, audit };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      this.auditService.emitAuditUpdate(result.target.tenantId, result.audit);
      return { success: true, user: result.updated, message: `Rôle mis à jour: ${result.updated.role}` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new ConflictException('Modification concurrente détectée. Veuillez réessayer.');
      throw error;
    }
  }

  async toggleSuperAdmin(actorUserId: string, targetUserId: string, reason: string) {
    this.assertDifferentActor(actorUserId, targetUserId);
    const safeReason = this.normalizeReason(reason);
    const actor = await this.getActor(actorUserId);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, role: true, tenantId: true, depotId: true, isActive: true, isSuperAdmin: true } });
        if (!target) throw new NotFoundException('Utilisateur introuvable.');
        if (!target.isSuperAdmin && !target.isActive) throw new BadRequestException('Un compte inactif doit être activé avant de recevoir le statut SuperAdmin.');
        if (target.isSuperAdmin && target.isActive) {
          const activeSuperAdmins = await tx.user.count({ where: { isSuperAdmin: true, isActive: true } });
          if (activeSuperAdmins <= 1) throw new ConflictException('Impossible de retirer le statut du dernier SuperAdmin actif.');
        }
        const updated = await tx.user.update({ where: { id: target.id }, data: { isSuperAdmin: !target.isSuperAdmin }, select: ADMIN_USER_SELECT });
        await this.revokeSessions(tx, target.id);
        const audit = await this.auditInTransaction(tx, actor, target,
          updated.isSuperAdmin ? AUDIT_ACTIONS.SUPERADMIN_GRANTED : AUDIT_ACTIONS.SUPERADMIN_REVOKED,
          `${updated.isSuperAdmin ? 'Attribution' : 'Retrait'} du statut SuperAdmin pour ${target.email}`,
          safeReason, { isSuperAdmin: target.isSuperAdmin }, { isSuperAdmin: updated.isSuperAdmin });
        return { target, updated, audit };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      this.auditService.emitAuditUpdate(result.target.tenantId, result.audit);
      return { success: true, user: result.updated, message: `Statut SuperAdmin ${result.updated.isSuperAdmin ? 'accordé' : 'retiré'}` };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new ConflictException('Modification concurrente détectée. Veuillez réessayer.');
      throw error;
    }
  }

  async deleteUser(actorUserId: string, targetUserId: string, reason: string) {
    this.assertDifferentActor(actorUserId, targetUserId);
    const safeReason = this.normalizeReason(reason);
    const actor = await this.getActor(actorUserId);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: targetUserId }, select: { id: true, email: true, role: true, tenantId: true, depotId: true, isActive: true, isSuperAdmin: true } });
        if (!user) throw new NotFoundException('Utilisateur introuvable.');
        if (user.isSuperAdmin && user.isActive) {
          const activeSuperAdmins = await tx.user.count({ where: { isSuperAdmin: true, isActive: true } });
          if (activeSuperAdmins <= 1) throw new ConflictException('Impossible de supprimer le dernier SuperAdmin actif.');
        }
        await this.revokeSessions(tx, user.id);
        try {
          await tx.user.delete({ where: { id: user.id } });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            throw new ConflictException('Cet utilisateur possède encore des données liées. Désactivez son compte plutôt que de le supprimer.');
          }
          throw error;
        }
        const audit = await this.auditInTransaction(tx, actor, user, AUDIT_ACTIONS.USER_DELETED,
          `Suppression définitive du compte ${user.email}`,
          safeReason, { id: user.id, email: user.email, role: user.role, isSuperAdmin: user.isSuperAdmin }, null);
        return { user, audit };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      this.auditService.emitAuditUpdate(result.user.tenantId, result.audit);
      return { success: true, message: 'Utilisateur supprimé définitivement.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') throw new ConflictException('Suppression concurrente détectée. Veuillez réessayer.');
      throw error;
    }
  }
}

function resultTarget(target: any, updated: any): any {
  return { ...target, depotId: target.depotId ?? updated.depotId ?? null };
}
