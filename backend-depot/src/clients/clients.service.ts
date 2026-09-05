import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DepotScopeService } from '../common/depot-scope.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private readonly depotScope: DepotScopeService,
  ) {}

  private normalizeDepotId(depotId?: string | null): string | undefined {
    if (!depotId || depotId === 'undefined' || depotId === 'null' || depotId === 'all') {
      return undefined;
    }
    return depotId;
  }

  private assertScope(tenantId: string, depotId: string): void {
    const scopedTenantId = this.depotScope.getTenantId();
    const scopedDepotId = this.depotScope.getDepotId();

    if (!scopedTenantId || scopedTenantId !== tenantId) {
      throw new ForbiddenException('Contexte tenant invalide.');
    }

    if (!scopedDepotId || scopedDepotId !== depotId) {
      throw new ForbiddenException('Contexte dépôt invalide.');
    }
  }

  async create(dto: any, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    return this.prisma.client.create({
      data: {
        nom: dto.nom,
        telephone: dto.telephone || null,
        adresse: dto.adresse || null,
        plafondCredit: Number(dto.plafondCredit) || 0,
        tenantId,
        depotId: effectiveDepotId,
      },
    });
  }

  async update(id: string, tenantId: string, dto: any, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);

    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, depotId: effectiveDepotId },
    });
    if (!client) throw new NotFoundException('Client introuvable');

    return this.prisma.client.update({
      where: { id },
      data: {
        nom: dto.nom !== undefined ? String(dto.nom).trim() : client.nom,
        telephone: dto.telephone !== undefined ? (dto.telephone || null) : client.telephone,
        adresse: dto.adresse !== undefined ? (dto.adresse || null) : client.adresse,
        plafondCredit: dto.plafondCredit !== undefined
          ? Number(dto.plafondCredit) || 0
          : client.plafondCredit,
        // Le dépôt d'un client ne peut pas être changé arbitrairement par le payload.
        depotId: client.depotId,
      },
    });
  }

  async findAll(tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    return this.prisma.client.findMany({
      where: { tenantId, depotId: effectiveDepotId },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    return this.prisma.client.findFirst({
      where: { id, tenantId, depotId: effectiveDepotId },
    });
  }

  async payerDette(id: string, montant: number, tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    if (!Number.isFinite(montant) || montant <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.findFirst({
        where: { id, tenantId, depotId: effectiveDepotId },
      });
      if (!client) throw new NotFoundException('Client introuvable');
      if (montant > client.soldeCredit) {
        throw new BadRequestException('Le montant dépasse le solde crédit du client');
      }

      const updated = await tx.client.update({
        where: { id },
        data: { soldeCredit: { decrement: montant } },
      });

      const dette = await tx.detteClient.create({
        data: {
          montant,
          montantPaye: montant,
          statut: 'SOLDEE',
          clientId: id,
          tenantId,
          depotId: effectiveDepotId,
        },
      });

      return { client: updated, dette };
    });

    return result;
  }

  async statsArdoise(tenantId: string, depotId?: string) {
    if (!tenantId) throw new BadRequestException('tenantId requis');
    const effectiveDepotId = this.normalizeDepotId(depotId);
    if (!effectiveDepotId) throw new BadRequestException('Dépôt actif requis');
    this.assertScope(tenantId, effectiveDepotId);
    return this.prisma.client.aggregate({
      where: { tenantId, depotId: effectiveDepotId },
      _sum: { soldeCredit: true },
    });
  }
}
