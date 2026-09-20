import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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

  /**
   * Contrôle d'autorité centralisé pour les mutations de comptes.
   * Le contrôleur ne doit jamais être la seule barrière : ce service peut
   * également être appelé par d'autres modules et doit donc rester fail-closed.
   */
  private async assertManagementScope(
    actor: AuditActor | undefined,
    targetRole: RoleUser,
    requestedDepotId?: string | null,
  ): Promise<string | null> {
    if (!actor?.userId || !actor.tenantId || !actor.role) {
      throw new ForbiddenException('Identité administrateur invalide.');
    }

    if (actor.role !== RoleUser.PATRON && actor.role !== RoleUser.GERANT) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit de gérer les utilisateurs.",
      );
    }

    // Un GERANT ne peut ni créer/promouvoir un PATRON, ni toucher à un GERANT.
    if (
      actor.role === RoleUser.GERANT &&
      (targetRole === RoleUser.PATRON || targetRole === RoleUser.GERANT)
    ) {
      throw new ForbiddenException(
        'Un GERANT ne peut pas gérer un PATRON ou un GERANT.',
      );
    }

    const depotId = requestedDepotId?.trim() || null;

    // Toute affectation explicite doit appartenir au tenant et viser un dépôt actif.
    if (depotId) {
      const depot = await this.prisma.depot.findFirst({
        where: {
          id: depotId,
          tenantId: actor.tenantId,
          isArchived: false,
        },
        select: { id: true },
      });
      if (!depot) {
        throw new BadRequestException('Dépôt invalide, inexistant ou archivé.');
      }
    }

    // Un GERANT reste confiné à son propre dépôt.
    if (actor.role === RoleUser.GERANT) {
      if (!actor.depotId) {
        throw new ForbiddenException("Ce GERANT n'est affecté à aucun dépôt.");
      }
      if (depotId && depotId !== actor.depotId) {
        throw new ForbiddenException(
          'Un GERANT ne peut affecter un utilisateur à un autre dépôt.',
        );
      }
      return actor.depotId;
    }

    return depotId;
  }

  /**
   * Valide les affectations multi-établissements (§13 matrice d'accès) :
   * chaque dépôt doit appartenir au tenant et être actif ; un GERANT ne peut
   * affecter que son propre dépôt. Retourne la liste normalisée (sans doublons).
   */
  private async assertDepotsAcces(
    actor: AuditActor,
    depotsAcces?: string[] | null,
  ): Promise<string[]> {
    if (depotsAcces === undefined || depotsAcces === null) return [];
    if (!Array.isArray(depotsAcces)) {
      throw new BadRequestException('depotsAcces doit être un tableau d’identifiants de dépôts.');
    }

    const uniques = [...new Set(depotsAcces.map((d) => String(d).trim()).filter(Boolean))];
    if (uniques.length === 0) return [];

    const depots = await this.prisma.depot.findMany({
      where: { id: { in: uniques }, tenantId: actor.tenantId!, isArchived: false },
      select: { id: true },
    });
    if (depots.length !== uniques.length) {
      throw new BadRequestException('Un ou plusieurs dépôts sont invalides, inexistants ou archivés.');
    }

    // Un GERANT reste confiné à son propre dépôt.
    if (actor.role === RoleUser.GERANT) {
      const horsPerimetre = uniques.filter((d) => d !== actor.depotId);
      if (horsPerimetre.length > 0) {
        throw new ForbiddenException(
          'Un GERANT ne peut affecter des utilisateurs qu’à son propre dépôt.',
        );
      }
    }

    return uniques;
  }

  /** Remplace les affectations multi-établissements d'un utilisateur. */
  private async replaceDepotsAcces(userId: string, tenantId: string, depots: string[]) {
    await this.prisma.userDepot.deleteMany({ where: { userId } });
    if (depots.length > 0) {
      await this.prisma.userDepot.createMany({
        data: depots.map((depotId) => ({ userId, depotId, tenantId })),
        skipDuplicates: true,
      });
    }
  }

  // Création d'un user avec mot de passe hashé automatiquement
  async create(
    data: {
      email: string;
      password: string;
      role: RoleUser;
      tenantId: string;
      nom?: string;
      depotId?: string;
      depotsAcces?: string[];
    },
    actor?: AuditActor,
  ) {
    if (!actor || data.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Création inter-tenant interdite.');
    }

    const depotId = await this.assertManagementScope(
      actor,
      data.role,
      data.depotId,
    );
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const depotsAcces = await this.assertDepotsAcces(actor, data.depotsAcces);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        nom: data.nom,
        tenantId: actor.tenantId,
        depotId,
        ...(depotsAcces.length > 0
          ? {
              depotsAcces: {
                create: depotsAcces.map((depotId) => ({
                  depotId,
                  tenantId: actor.tenantId as string,
                })),
              },
            }
          : {}),
      },
      include: { depotsAcces: { select: { depotId: true } } },
    });

    await this.auditService
      .logEvent({
        tenantId: actor.tenantId,
        depotId: depotId ?? actor.depotId ?? null,
        actorUserId: actor.userId,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.UTILISATEUR_CREE,
        severite: AuditSeverite.ATTENTION,
        targetType: 'User',
        targetId: user.id,
        reference: user.email,
        description: `Utilisateur ${user.email} créé (rôle ${user.role})`,
        valeurApres: {
          email: user.email,
          role: user.role,
          depotId: user.depotId,
        },
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) =>
        console.error('[Audit] Échec log UTILISATEUR_CREE:', err),
      );

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
        depotsAcces: { select: { depotId: true } },
        // password exclu
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCommerciaux(tenantId: string, depotId?: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        role: RoleUser.COMMERCIAL,
        ...(depotId ? { depotId } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        tenantId: true,
        depotId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // GET /:id — Détail d'un employé (Phase 4)
  async findOne(tenantId: string, id: string, depotId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, ...(depotId ? { depotId } : {}) },
      select: {
        id: true,
        email: true,
        role: true,
        nom: true,
        tenantId: true,
        depotId: true,
        isActive: true,
        createdAt: true,
        depotsAcces: { select: { depotId: true } },
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
    if (!actor || tenantId !== actor.tenantId) {
      throw new ForbiddenException('Opération inter-tenant interdite.');
    }

    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        isActive: true,
        email: true,
        role: true,
        depotId: true,
      },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    if (actor.role === RoleUser.GERANT && avant.depotId !== actor.depotId) {
      throw new ForbiddenException(
        'Un GERANT ne peut modifier que les utilisateurs de son dépôt.',
      );
    }

    await this.assertManagementScope(actor, avant.role, avant.depotId);

    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { isActive: Boolean(isActive) },
    });
    if (result.count === 0)
      throw new NotFoundException('Utilisateur introuvable');

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
      .catch((err) =>
        console.error('[Audit] Échec log UTILISATEUR_DESACTIVE:', err),
      );

    return user;
  }

  // Mise à jour partielle (rôle, nom, dépôt)
  async update(
    id: string,
    data: { nom?: string; role?: RoleUser; depotId?: string; depotsAcces?: string[] },
    tenantId: string,
    actor?: AuditActor,
  ) {
    if (!actor || tenantId !== actor.tenantId) {
      throw new ForbiddenException('Opération inter-tenant interdite.');
    }

    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, nom: true, role: true, depotId: true, email: true },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    if (actor.role === RoleUser.GERANT && avant.depotId !== actor.depotId) {
      throw new ForbiddenException(
        'Un GERANT ne peut modifier que les utilisateurs de son dépôt.',
      );
    }

    const nextRole = data.role ?? avant.role;
    const nextDepotId =
      data.depotId !== undefined ? data.depotId : avant.depotId;
    const managedDepotId = await this.assertManagementScope(
      actor,
      nextRole,
      nextDepotId,
    );

    const safeData: { nom?: string; role?: RoleUser; depotId?: string | null } =
      {};
    if (data.nom !== undefined) safeData.nom = data.nom;
    if (data.role !== undefined) safeData.role = data.role;
    if (data.depotId !== undefined || actor.role === RoleUser.GERANT) {
      safeData.depotId = managedDepotId;
    }

    if (Object.keys(safeData).length === 0) {
      return this.findOne(
        tenantId,
        id,
        actor.role === RoleUser.GERANT
          ? (actor.depotId ?? undefined)
          : undefined,
      );
    }

    const result = await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: safeData,
    });
    if (result.count === 0)
      throw new NotFoundException('Utilisateur introuvable');

    // Multi-établissements (§13) : remplacement complet des affectations si
    // le champ est fourni (null/[] = retrait de tous les accès additionnels).
    if (data.depotsAcces !== undefined) {
      const depotsAcces = await this.assertDepotsAcces(actor, data.depotsAcces);
      await this.replaceDepotsAcces(id, tenantId, depotsAcces);
    }

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
        valeurApres: safeData,
        ipAddress: actor.ip,
        userAgent: actor.userAgent,
      })
      .catch((err) =>
        console.error('[Audit] Échec log UTILISATEUR_MODIFIE:', err),
      );

    return user;
  }

  // Suppression d'un utilisateur
  async remove(id: string, tenantId: string, actor?: AuditActor) {
    if (!actor || tenantId !== actor.tenantId) {
      throw new ForbiddenException('Opération inter-tenant interdite.');
    }

    const avant = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: { id: true, email: true, role: true, nom: true, depotId: true },
    });
    if (!avant) throw new NotFoundException('Utilisateur introuvable');

    if (actor.role === RoleUser.GERANT && avant.depotId !== actor.depotId) {
      throw new ForbiddenException(
        'Un GERANT ne peut supprimer que les utilisateurs de son dépôt.',
      );
    }

    await this.assertManagementScope(actor, avant.role, avant.depotId);

    const user = await this.prisma.user.deleteMany({ where: { id, tenantId } });
    if (user.count === 0)
      throw new NotFoundException('Utilisateur introuvable');

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
      .catch((err) =>
        console.error('[Audit] Échec log SUPPRESSION_UTILISATEUR:', err),
      );

    return { id, deleted: true };
  }
}
