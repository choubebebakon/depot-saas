import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { NotifType } from '@prisma/client';
import { IsString, IsInt, IsOptional, IsNumber, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional() page?: number;
  @IsOptional() limit?: number;
  @IsOptional() search?: string;
}

export class CreateDossierDto {
  @IsString() clientId: string;
  @IsOptional() @IsString() groupeSanguin?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() antecedents?: string;
  @IsOptional() @IsString() traitementEnCours?: string;
}

export class CreateConsultationDto {
  @IsString() dossierId: string;
  @IsOptional() @IsString() medecinId?: string;
  @IsOptional() @IsString() specialite?: string;
  @IsString() motif: string;
  @IsOptional() @IsString() examen?: string;
  @IsOptional() @IsString() diagnostic?: string;
  @IsOptional() @IsNumber() montant?: number;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePrescriptionDto {
  @IsOptional() @IsString() articleId?: string;
  @IsString() medicament: string;
  @IsOptional() @IsString() dosage?: string;
  @IsOptional() @IsString() posologie?: string;
  @IsOptional() @IsString() duree?: string;
}

export class CreateRdvDto {
  @IsString() clientId: string;
  @IsOptional() @IsString() medecinId?: string;
  @IsOptional() @IsString() specialite?: string;
  @IsString() dateHeure: string;
  @IsOptional() @IsString() motif?: string;
  @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class CliniqueService {
  private readonly logger = new Logger(CliniqueService.name);
  constructor(
    private prisma: PrismaService,
    private notifService: NotificationsService,
  ) {}

  async findAllDossiers(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (pagination.search) {
      where.client = {
        OR: [
          { nom: { contains: pagination.search, mode: 'insensitive' } },
          { prenom: { contains: pagination.search, mode: 'insensitive' } },
        ],
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.dossierMedical.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: true,
          consultations: { take: 3, orderBy: { date: 'desc' } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.dossierMedical.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createDossier(tenantId: string, dto: CreateDossierDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client || client.tenantId !== tenantId)
      throw new NotFoundException('Client introuvable');
    return this.prisma.dossierMedical.create({
      data: { ...dto, tenantId },
      include: { client: true },
    });
  }

  async getDossier(id: string) {
    const dossier = await this.prisma.dossierMedical.findUnique({
      where: { id },
      include: {
        client: true,
        consultations: {
          include: { prescriptions: true },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!dossier) throw new NotFoundException('Dossier introuvable');
    return dossier;
  }

  async findAllConsultations(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        include: {
          dossier: { include: { client: true } },
          prescriptions: true,
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.consultation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createConsultation(tenantId: string, dto: CreateConsultationDto) {
    const dossier = await this.prisma.dossierMedical.findUnique({
      where: { id: dto.dossierId },
    });
    if (!dossier || dossier.tenantId !== tenantId)
      throw new NotFoundException('Dossier introuvable');
    return this.prisma.consultation.create({
      data: { ...dto, tenantId },
      include: { dossier: { include: { client: true } } },
    });
  }

  async addPrescription(consultationId: string, dto: CreatePrescriptionDto) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });
    if (!consultation) throw new NotFoundException('Consultation introuvable');
    return this.prisma.prescription.create({
      data: { ...dto, consultationId },
    });
  }

  async findAllRdvs(tenantId: string, pagination: PaginationDto) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 30;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.rendezVousMedical.findMany({
        where,
        skip,
        take: limit,
        include: { client: true },
        orderBy: { dateHeure: 'desc' },
      }),
      this.prisma.rendezVousMedical.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createRdv(tenantId: string, dto: CreateRdvDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client || client.tenantId !== tenantId)
      throw new NotFoundException('Client introuvable');
    const rdv = await this.prisma.rendezVousMedical.create({
      data: { ...dto, tenantId, dateHeure: new Date(dto.dateHeure) },
      include: { client: true },
    });
    this.notifService
      .createFromTemplate(tenantId, NotifType.RDV_RAPPEL, {
        patient: rdv.client?.nom || 'Patient',
        heure: dto.dateHeure,
      })
      .catch((e) => this.logger.error(`Erreur notif rdv: ${e.message}`));
    return rdv;
  }

  async updateRdvStatut(id: string, statut: string) {
    return this.prisma.rendezVousMedical.update({
      where: { id },
      data: { statut: statut as any },
      include: { client: true },
    });
  }

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalPatients = await this.prisma.dossierMedical.count({
      where: { tenantId },
    });
    const rdvsAujourdhui = await this.prisma.rendezVousMedical.count({
      where: { tenantId, dateHeure: { gte: today, lt: tomorrow } },
    });
    const rdvsPlanifies = await this.prisma.rendezVousMedical.count({
      where: { tenantId, statut: 'PLANIFIE' },
    });
    const consultationsEnCours = await this.prisma.consultation.count({
      where: { tenantId, statut: 'EN_COURS' },
    });
    const totalConsultations = await this.prisma.consultation.count({
      where: { tenantId },
    });

    return {
      totalPatients,
      rdvsAujourdhui,
      rdvsPlanifies,
      consultationsEnCours,
      totalConsultations,
    };
  }
}
